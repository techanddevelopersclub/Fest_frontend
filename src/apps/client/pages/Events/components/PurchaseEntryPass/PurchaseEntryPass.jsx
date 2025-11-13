import { useState, useEffect } from "react";
import QRCode from "../../../../components/QRCode/QRCode";
import styles from "./PurchaseEntryPass.module.css";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../state/redux/auth/authSlice";
import Button from "../../../../atoms/Button";
import Modal from "../../../../components/Modal/Modal";
import { usePurchaseEntryPassMutation, useGetEntryPassesBySelfQuery } from "../../../../../../state/redux/entryPass/entryPassApi";
import { useCreatePendingEntryPassMutation, useListMyPendingEntryPassesQuery } from "../../../../../../state/redux/pendingEntryPass/pendingEntryPassApi";

import { toast } from "../../../../components/Toast";
import ApplyPromoCode from "../../../../components/ApplyPromoCode/ApplyPromoCode";

const PurchaseEntryPass = ({ event = {}, close }) => {
  const user = useSelector(selectUser);
  const [error, setError] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountedTotal, setDiscountedTotal] = useState(event.entryPassPriceInINR || 0);
  const [purchaseEntryPass, { isLoading }] = usePurchaseEntryPassMutation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [hasVerifiedEntryPass, setHasVerifiedEntryPass] = useState(false);
  
  // Fetch pending verification status and verified entry passes for this user/event on mount
  // Poll every 10 seconds when there's a pending verification to check for updates
  const { data: pendingEntryPassesRaw, isLoading: pendingLoading, error: pendingError, refetch: refetchPending } = useListMyPendingEntryPassesQuery(
    { event: event._id }, 
    {
      pollingInterval: pendingVerification ? 10000 : 0, // Poll every 10 seconds if pending
    }
  );
  const { data: { entryPasses } = {}, isLoading: entryPassLoading, error: entryPassError, refetch: refetchEntryPasses } = useGetEntryPassesBySelfQuery(undefined, {
    pollingInterval: pendingVerification ? 10000 : 0, // Poll every 10 seconds if pending
  });

  
  useEffect(() => {
    // Handle pending entry passes - check if user has pending payment for this event
    if (pendingEntryPassesRaw && Array.isArray(pendingEntryPassesRaw)) {
      const isPending = pendingEntryPassesRaw.some(
        (p) => {
          // Check if this pending entry pass is for the current event and user, and status is pending
          // p.event is a populated object, so we need to check p.event._id
          const eventMatch = (p.event === event._id || String(p.event) === String(event._id)) || 
                           (p.event && p.event._id && (p.event._id === event._id || String(p.event._id) === String(event._id)));
          const userMatch = p.user === user._id || String(p.user) === String(user._id);
          const statusPending = p.paymentStatus === "pending";
          
          return eventMatch && userMatch && statusPending;
        }
      );
      setPendingVerification(isPending);
    }
    
    // Check if user already has a verified entry pass for this event
    if (entryPasses && Array.isArray(entryPasses)) {
      const hasEntryPass = entryPasses.some(
        (ep) => {
          // Check if this entry pass is for the current event
          const eventMatch = ep.event === event._id || ep.event?._id === event._id;
          return eventMatch;
        }
      );
      setHasVerifiedEntryPass(hasEntryPass);
    }
  }, [pendingEntryPassesRaw, entryPasses, event._id, user._id]);

  // Separate effect to handle transition from pending to verified
  useEffect(() => {
    if (hasVerifiedEntryPass && pendingVerification) {
      setPendingVerification(false);
      toast.success("Your payment has been verified! Entry pass is now active.");
    }
  }, [hasVerifiedEntryPass, pendingVerification]);
  
  const [createPendingEntryPass, { isLoading: isPendingLoading }] = useCreatePendingEntryPassMutation();

  const handleChange = (e) => {
    setPromoCode(e.target.value);
  };

const handleSubmit = (e) => {
  e.preventDefault();
  setError(null);

  // Check if user already has a verified entry pass
  if (hasVerifiedEntryPass) {
    toast.success("You already have an entry pass for this event!");
    close();
    return;
  }

  if (event.entryPassPriceInINR > 0) {
    // Paid event → open payment modal directly
    setShowPaymentModal(true);
  } else {
    // Free event → mark registration as done (or just close modal)
    toast.success("Registered successfully");
    close();
  }
};

  // UPI QR link generator using environment variables
  const getUpiLink = () => {
    const accountNumber = import.meta.env.VITE_UPI_ACCOUNT_NUMBER || event.upiAccountNumber || "demoaccount";
    const ifsc = import.meta.env.VITE_UPI_IFSC || event.upiIfsc || "demoifsc";
    const name = import.meta.env.VITE_UPI_NAME ||  "CIESYZC";
    // Use discounted total if a promotion is applied
    const amount = (discountedTotal > 0 ? discountedTotal : event.entryPassPriceInINR) || 1;
    return `upi://pay?pa=${accountNumber}@${ifsc}.ifsc.npci&pn=${name}&am=${amount}&cu=INR`;
  };

  // Cloudinary unsigned upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); // You must set this preset in Cloudinary dashboard
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadedFileUrl(data.secure_url);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error("File upload failed");
    }
  };



  const handlePaymentModalSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFileUrl) {
      toast.error("Please upload payment proof");
      return;
    }
    try {
      await createPendingEntryPass({
        event: event._id,
        user: user._id,
        paymentProofUrl: uploadedFileUrl,
        promoCode: promoCode || undefined,
        discountedAmountInINR: discountedTotal,
      }).unwrap();
      
      toast.success("Submitted for verification");
      setShowPaymentModal(false);
      setPendingVerification(true);
      
      // Manually refetch data to ensure we get the latest status
      refetchPending();
      refetchEntryPasses();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to submit for verification");
    }
  };

  const handleApplyPromoCode = (promotion) => {
    setPromoCode(promotion?.promoCode || "");
    setAppliedPromotion(promotion || null);

    // compute discounted total similar to ApplyPromoCode component
    if (promotion) {
      if (promotion.discountType === "percentage") {
        const discountValue = Math.min(
          (promotion.discountValue * (event.entryPassPriceInINR || 0)) / 100,
          event.entryPassPriceInINR || 0
        );
        setDiscountedTotal((event.entryPassPriceInINR || 0) - discountValue);
      } else {
        const discountValue = Math.min(
          promotion.discountValue,
          event.entryPassPriceInINR || 0,
          promotion.maxDiscountInINR || promotion.discountValue
        );
        setDiscountedTotal((event.entryPassPriceInINR || 0) - discountValue);
      }
    } else {
      setDiscountedTotal(event.entryPassPriceInINR || 0);
    }
  };

  if (!event || !user) {
    return (
      <Modal
        title={!event ? "Event not found" : "Login to register"}
        close={close}
      />
    );
  }

  // Show loading state while checking payment status
  if (pendingLoading || entryPassLoading) {
    return (
      <Modal title={event.name} close={close}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>Loading payment status...</p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal title={event.name} close={close}>
        <div className={styles.details}>
          <div className={styles.item}>
            <p className={styles.key}>Name</p>
            <p className={styles.value}>{user.name}</p>
          </div>
          <div className={styles.item}>
            <p className={styles.key}>Contact Email</p>
            <p className={styles.value}>{user.email}</p>
          </div>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          {event.entryPassPriceInINR > 0 && (
            <ApplyPromoCode
              onChange={handleChange}
              defaultValue={promoCode}
              orderType={`event:${event._id}`}
              orderAmount={event.entryPassPriceInINR}
              onApply={handleApplyPromoCode}
              disabled={pendingVerification || hasVerifiedEntryPass}
            />
          )}
          {error && <p className={styles.error}>{error}</p>}
          <Button
            variant="secondary"
            type="submit"
            className={styles.submit}
            disabled={pendingVerification || isLoading || hasVerifiedEntryPass}
          >
            {hasVerifiedEntryPass 
              ? "Entry Pass Already Purchased" 
              : event.entryPassPriceInINR > 0 
                ? "Pay and Get Pass" 
                : "Get Pass"
            }
          </Button>
        </form>
      </Modal>

      {showPaymentModal && (
        <Modal title="Complete Payment" close={() => setShowPaymentModal(false)}>
          <div style={{ textAlign: "center" }}>
            <p style={{ marginBottom: 20, fontWeight: "bold", fontSize: "18px", color: "#333" }}>Send payment to the following account:</p>
            <div style={{ 
              backgroundColor: "#e8f4f8", 
              padding: "20px", 
              borderRadius: "12px", 
              marginBottom: 20,
              textAlign: "left",
              border: "2px solid #4a90e2"
            }}>
              <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #b3d9e8" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#2c5aa0", fontSize: "13px" }}>Account Number</p>
                  <p style={{ margin: 0, fontSize: "18px", fontFamily: "monospace", color: "#0066cc", fontWeight: "600" }}>{import.meta.env.VITE_UPI_ACCOUNT_NUMBER || event.upiAccountNumber || "N/A"}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(import.meta.env.VITE_UPI_ACCOUNT_NUMBER || event.upiAccountNumber || "");
                    toast.success("Account number copied!");
                  }}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginLeft: 10
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #b3d9e8" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#2c5aa0", fontSize: "13px" }}>IFSC Code</p>
                  <p style={{ margin: 0, fontSize: "18px", fontFamily: "monospace", color: "#0066cc", fontWeight: "600" }}>{import.meta.env.VITE_UPI_IFSC || event.upiIfsc || "N/A"}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(import.meta.env.VITE_UPI_IFSC || event.upiIfsc || "");
                    toast.success("IFSC code copied!");
                  }}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginLeft: 10
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#2c5aa0", fontSize: "13px" }}>Account Holder Name</p>
                  <p style={{ margin: 0, fontSize: "18px", fontFamily: "monospace", color: "#0066cc", fontWeight: "600" }}>{import.meta.env.VITE_UPI_NAME || "N/A"}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(import.meta.env.VITE_UPI_NAME || "");
                    toast.success("Account holder name copied!");
                  }}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginLeft: 10
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <p style={{ marginBottom: 10, color: "#333", fontSize: "16px" }}>Amount to pay: <span style={{ fontSize: "22px", color: "#27ae60", fontWeight: "bold" }}>₹{discountedTotal}</span></p>
            <div style={{ marginTop: 20 }}>
              <label>Upload payment proof (screenshot/pdf):</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} style={{ marginTop: 10 }} disabled={pendingVerification} />
              {uploadedFileUrl && (
                <div style={{ marginTop: 10 }}>
                  <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">View Uploaded File</a>
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              type="button"
              className={styles.submit}
              onClick={handlePaymentModalSubmit}
              disabled={!uploadedFileUrl || isPendingLoading || pendingVerification}
              style={{ marginTop: 20 }}
            >
              {isPendingLoading ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </Modal>
      )}

      {pendingVerification && (
        <Modal title="Payment Verification Status" close={null}>
          <div style={{ textAlign: "center" }}>
            <p>Your payment proof has been submitted.</p>
            <p>Status: <b>Pending Verification</b></p>
            <p>Please wait while we verify your payment. You will receive an email once verified.</p>
          </div>
        </Modal>
      )}

      {hasVerifiedEntryPass && (
        <Modal title="Entry Pass Status" close={close}>
          <div style={{ textAlign: "center" }}>
            <p>✅ <b>Your entry pass has been verified!</b></p>
            <p>You can now attend this event.</p>
            <Button 
              variant="success" 
              onClick={close}
              style={{ marginTop: "10px" }}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default PurchaseEntryPass;
