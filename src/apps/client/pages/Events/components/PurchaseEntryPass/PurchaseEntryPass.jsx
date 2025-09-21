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
    const amount = event.entryPassPriceInINR || 1;
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
            <p>Scan this QR to pay via UPI:</p>
            <QRCode data={getUpiLink()} height={220} width={220} />
            <p style={{ marginTop: 10 }}>Or use this link:</p>
            <a href={getUpiLink()} target="_blank" rel="noopener noreferrer" style={{ color: "violet" }}>Pay Now</a>
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
