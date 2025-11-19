import { useState, useEffect } from "react";
import styles from "./Registration.module.css";
import { useCreateParticipantMutation } from "../../../../../../state/redux/participants/participantsApi";
import { useCreatePendingParticipantMutation, useListPendingParticipantsQuery } from "../../../../../../state/redux/pendingParticipants/pendingParticipantsApi";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../state/redux/auth/authSlice";
import Button from "../../../../atoms/Button";
import Modal from "../../../../components/Modal/Modal";

import { toast } from "../../../../components/Toast";
import ApplyPromoCode from "../../../../components/ApplyPromoCode/ApplyPromoCode";

const Registration = ({ event = {}, close }) => {
  const user = useSelector(selectUser);
  const [participant, setParticipant] = useState({
    event: event._id,
    leader: user?._id,
    members: [user?._id],
    teamName: "",
    teamMemberNames: [user?.name || ""],
    teamSize: 1,
  });
  const [error, setError] = useState(null);
  const [memberIds, setMemberIds] = useState([]);
  const [memberNames, setMemberNames] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountedTotal, setDiscountedTotal] = useState(event.registrationFeesInINR || 0);
  const [createParticipant, { isLoading }] = useCreateParticipantMutation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  // Fetch pending verification status for this user/event on mount
  const { data: pendingParticipantsRaw } = useListPendingParticipantsQuery();
  useEffect(() => {
    if (pendingParticipantsRaw && Array.isArray(pendingParticipantsRaw)) {
      const isPending = pendingParticipantsRaw.some(
        (p) => p.event === event._id && p.leader === user._id && p.paymentStatus === "pending"
      );
      setPendingVerification(isPending);
    }
  }, [pendingParticipantsRaw, event._id, user._id]);

  // Cleanup initial state: filter out any accidental leader duplicates
  useEffect(() => {
    if (event.minTeamSize > 1) {
      // For team events, ensure no leader in memberIds or memberNames
      setMemberIds(prev => prev.filter(id => id !== user?._id));
      setMemberNames(prev => prev.filter((name, idx) => memberIds[idx] !== user?._id));
    }
  }, [user?._id, event.minTeamSize]);
  const [verificationStatus, setVerificationStatus] = useState(false);
  const [createPendingParticipant, { isLoading: isPendingLoading }] = useCreatePendingParticipantMutation();

  const handleChange = (e) => {
    setParticipant({
      ...participant,
      [e.target.name]: e.target.value,
    });
  };

  const MONGO_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

  const handleTeamMembersChange = (e) => {
    const input = e.target.value;
    const parsed = input
      .split(",")
      .map((member) => member.trim())
      .filter((member) => member !== "");

    // Block if leader's ID is included
    if (parsed.includes(user._id)) {
      setError("Do not include the team leader's ID in members list");
      return;
    }

    // Validate ObjectId format for all entries
    const invalidIds = parsed.filter(id => !MONGO_OBJECTID_REGEX.test(id));
    if (invalidIds.length > 0) {
      setError(`Invalid ID format. All IDs must be valid ObjectIds (${invalidIds[0]})`);
      return;
    }

    const uniqueMemberIds = [...new Set(parsed)];
    const minMembers = Math.max(0, (event.minTeamSize || 1) - 1);
    const maxMembers = Math.max(0, (event.maxTeamSize || 1) - 1);

    if (uniqueMemberIds.length < minMembers) {
      setError(`Please enter ${minMembers} member ID${minMembers > 1 ? "s" : ""}`);
    } else if (uniqueMemberIds.length > maxMembers) {
      setError(`Maximum members allowed is ${maxMembers}`);
    } else {
      setError(null);
    }

    setMemberIds(uniqueMemberIds);
    // Keep memberNames aligned; trim if IDs were removed
    setMemberNames(prev => prev.slice(0, uniqueMemberIds.length));
  };

  const handleTeamMemberNamesChange = (e) => {
    if (event.minTeamSize <= 1) {
      // For solo events, just accept the entered name
      setMemberNames(e.target.value ? [e.target.value] : [user.name]);
    } else {
      // For team events, parse comma-separated names
      let names = e.target.value
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name !== "");
      
      // Filter out leader's name if accidentally included
      names = names.filter(name => name.toLowerCase() !== user?.name?.toLowerCase());
      
      setMemberNames(names);
    }
  };

  const handleRemoveMember = (index) => {
    // Only filter by index, no shifting or complex logic
    setMemberIds(prev => prev.filter((_, i) => i !== index));
    setMemberNames(prev => prev.filter((_, i) => i !== index));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  if (event.registrationFeesInINR > 0) {
    // Paid event → open payment modal directly
    setShowPaymentModal(true);
  } else {
    try {
      // Build members array: always include leader + member IDs
      const members = [...new Set([...memberIds, user._id])];
      const teamMemberNames = [...memberNames, user.name];
      const teamSize = members.length;

      const participantData = {
        event: event._id,
        leader: user._id,
        isTeam: event.minTeamSize > 1,
        teamName: participant.teamName || "",
        members,
        teamMemberNames,
        teamSize,
      };
      
      console.log("Sending participant data:", participantData);
      
      await createParticipant({
        participant: participantData,
        promoCode: promoCode || null,
      }).unwrap();

      toast.success("Registered successfully");
      close();
    } catch (err) {
      toast.error(err?.data?.error || "Registration failed");
    }
  }
};



  // UPI QR link generator using environment variables
  const getUpiLink = () => {
    const accountNumber = import.meta.env.VITE_UPI_ACCOUNT_NUMBER || event.upiAccountNumber || "demoaccount";
    const ifsc = import.meta.env.VITE_UPI_IFSC || event.upiIfsc || "demoifsc";
    const name = import.meta.env.VITE_UPI_NAME ||  "CIESYZC";
    const amount = (discountedTotal > 0 ? discountedTotal : event.registrationFeesInINR) || 1;
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
      // Build members array from state
      const members = [...new Set([...memberIds, user._id])];
      const teamMemberNames = [...memberNames, user.name];
      const teamSize = members.length;

      const pendingData = {
        event: event._id,
        leader: user._id,
        isTeam: event.minTeamSize > 1,
        teamName: participant.teamName || "",
        members,
        teamMemberNames,
        teamSize,
        paymentProofUrl: uploadedFileUrl,
        promoCode: promoCode || undefined,
        discountedAmountInINR: discountedTotal,
      };

      console.log("Sending pending participant data:", pendingData);

      await createPendingParticipant(pendingData).unwrap();
      toast.success("Submitted for verification");
      setShowPaymentModal(false);
      setPendingVerification(true);
      // Optionally start polling for verification status here
    } catch (err) {
      toast.error(err?.data?.error || "Failed to submit for verification");
    }
  };

  const handleApplyPromoCode = (promotion) => {
    setPromoCode(promotion?.promoCode || "");
    setAppliedPromotion(promotion || null);

    if (promotion) {
      if (promotion.discountType === "percentage") {
        const discountValue = Math.min(
          (promotion.discountValue * (event.registrationFeesInINR || 0)) / 100,
          event.registrationFeesInINR || 0
        );
        setDiscountedTotal((event.registrationFeesInINR || 0) - discountValue);
      } else {
        const discountValue = Math.min(
          promotion.discountValue,
          event.registrationFeesInINR || 0,
          promotion.maxDiscountInINR || promotion.discountValue
        );
        setDiscountedTotal((event.registrationFeesInINR || 0) - discountValue);
      }
    } else {
      setDiscountedTotal(event.registrationFeesInINR || 0);
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

  return (
    <>
      <Modal 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>{event.name}</span>
            {participant.teamSize > 0 && (
              <span 
                style={{
                  background: 'var(--color-secondary-500)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}
              >
                {participant.teamSize} member{(participant.teamSize || 1) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        } 
        close={close}
      >
        <div className={styles.participantDetails}>
          <div className={styles.item}>
            <p className={styles.key}>
              {event.minTeamSize > 1 ? "Team Leader" : "Participant"}
            </p>
            <p className={styles.value}>{user.name}</p>
          </div>
          <div className={styles.item}>
            <p className={styles.key}>Contact Email</p>
            <p className={styles.value}>{user.email}</p>
          </div>
          {participant.teamName && (
            <div className={styles.item}>
              <p className={styles.key}>
                {event.minTeamSize > 1 ? "Team Name" : "Participant Name"}
              </p>
              <p className={styles.value}>{participant.teamName}</p>
            </div>
          )}
          <div className={styles.item}>
            <p className={styles.key}>Team Size</p>
            <p className={styles.value}>{participant.teamSize || 1} member{(participant.teamSize || 1) !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="teamName">
              {event.minTeamSize > 1 ? "Team Name" : "Participant Name"}
            </label>
            <input
              type="text"
              name="teamName"
              id="teamName"
              required
              className={styles.input}
              onChange={handleChange}
              disabled={pendingVerification}
              placeholder={event.minTeamSize > 1 ? "Enter team name" : "Enter your name"}
            />
          </div>
          
          {event.minTeamSize > 1 && (
            <div className={styles.formGroup}>
              <label htmlFor="teamMembers">Team Members (IDs)</label>
              <textarea
                type="text"
                name="teamMembers"
                id="teamMembers"
                className={styles.input}
                onChange={handleTeamMembersChange}
                value={memberIds.join(", ")}
                placeholder="Enter comma separated IDs of your team members."
                disabled={pendingVerification}
              />
              <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
                <div>• Enter a valid ID</div>
                <div>• Only enter members ID (Not Team Leader)</div>
              </div>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="teamMemberNames">
              {event.minTeamSize > 1 ? "Team Member Names" : "Participant Name"}
            </label>
            <textarea
              type="text"
              name="teamMemberNames"
              id="teamMemberNames"
              className={styles.input}
              onChange={handleTeamMemberNamesChange}
              value={memberNames.join(", ")}
              placeholder={event.minTeamSize > 1 ? "Enter comma separated names of your team members." : "Enter your name"}
              disabled={pendingVerification}
            />
            <div className={styles.members}>
              {memberNames.map((memberName, index) => (
                <div className={styles.member} key={index}>
                  <div className={styles.name}>{memberName}</div>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => handleRemoveMember(index)}
                    disabled={pendingVerification}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            {memberNames.length > 0 && (
              <div className={styles.teamInfo}>
                <p className={styles.teamCount}>
                  Total Team Members: <strong>{memberIds.length + 1}</strong>
                </p>
              </div>
            )}
          </div>
          {event.registrationFeesInINR > 0 && (
            <ApplyPromoCode
              onChange={(p) => setPromoCode(p)}
              defaultValue={promoCode}
              orderType={`event:${event._id}`}
              orderAmount={event.registrationFeesInINR}
              onApply={handleApplyPromoCode}
              disabled={pendingVerification}
            />
          )}
          {error && <p className={styles.error}>{error}</p>}
          <Button
            variant="secondary"
            type="submit"
            className={styles.submit}
            disabled={
              pendingVerification ||
              !participant.teamName ||
              (event.minTeamSize > 1 &&
                (memberIds.length < (event.minTeamSize - 1) ||
                 memberIds.length > (event.maxTeamSize - 1))) ||
              isLoading
            }
          >
            {event.registrationFeesInINR > 0 ? "Pay and Confirm" : "Confirm"}
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
        <Modal title="Pending Verification" close={null}>
          <div style={{ textAlign: "center" }}>
            <p>Your payment proof has been submitted.</p>
            <p>Status: <b>{verificationStatus ? "Verified" : "Pending"}</b></p>
            {!verificationStatus && <p>Please wait while we verify your payment.</p>}
          </div>
        </Modal>
      )}
    </>
  );
};

export default Registration;
