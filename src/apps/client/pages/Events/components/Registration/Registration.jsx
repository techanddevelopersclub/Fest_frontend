import { useState, useEffect } from "react";
import styles from "./Registration.module.css";
import { useCreateParticipantMutation } from "../../../../../../state/redux/participants/participantsApi";
import { useCreatePendingParticipantMutation, useListPendingParticipantsQuery } from "../../../../../../state/redux/pendingParticipants/pendingParticipantsApi";
import { useGetUserByIdQuery } from "../../../../../../state/redux/users/usersApi";
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
  const [membersInput, setMembersInput] = useState("");
  const [memberNamesInput, setMemberNamesInput] = useState("");
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

  // Initialize member names input
  useEffect(() => {
    if (event.minTeamSize <= 1) {
      // For solo events, initialize with user's name
      setMemberNamesInput(user?.name || "");
    } else {
      // For team events, initialize empty
      setMemberNamesInput("");
    }
    
    // Ensure team size is properly initialized
    setParticipant(prev => ({
      ...prev,
      teamSize: prev.members.length
    }));
  }, [event.minTeamSize, user?.name]);

  // Auto-fetch and populate member names when member IDs are added
  useEffect(() => {
    const fetchMemberNames = async () => {
      if (participant.members.length <= 1) return; // Only leader
      
      const memberIds = participant.members.filter(id => id !== user._id);
      if (memberIds.length === 0) return;

      const namesToFetch = [];
      
      for (const memberId of memberIds) {
        // Only fetch if we don't already have a name for this ID
        const existingNameIndex = participant.teamMemberNames.findIndex(
          (_, idx) => participant.members[idx] === memberId
        );
        
        if (existingNameIndex === -1) {
          namesToFetch.push(memberId);
        }
      }

      if (namesToFetch.length === 0) return;

      // Fetch each member's data
      try {
        const fetchedNames = [];
        for (const memberId of namesToFetch) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${memberId}`);
            if (response.ok) {
              const data = await response.json();
              fetchedNames.push({ id: memberId, name: data.user?.name || data.name || "Unknown" });
            }
          } catch (err) {
            console.error(`Failed to fetch user ${memberId}:`, err);
            fetchedNames.push({ id: memberId, name: "Unknown" });
          }
        }

        // Update member names with fetched data
        let updatedNames = [...participant.teamMemberNames];
        for (const { id, name } of fetchedNames) {
          const index = participant.members.indexOf(id);
          if (index !== -1 && updatedNames[index] !== name) {
            updatedNames[index] = name;
          }
        }

        setParticipant(prev => ({
          ...prev,
          teamMemberNames: updatedNames
        }));
        setMemberNamesInput(updatedNames.join(", "));
      } catch (err) {
        console.error("Error fetching member names:", err);
      }
    };

    fetchMemberNames();
  }, [participant.members, user._id]);

  const [verificationStatus, setVerificationStatus] = useState(false);
  const [createPendingParticipant, { isLoading: isPendingLoading }] = useCreatePendingParticipantMutation();

  const handleChange = (e) => {
    setParticipant({
      ...participant,
      [e.target.name]: e.target.value,
    });
  };

  const handleTeamMembersChange = (e) => {
    let members = e.target.value
      .split(",")
      .map((member) => member.trim())
      .filter((member) => member !== "");
    members = [...members, user._id];
    members = [...new Set(members)];
    
    // Update error state based on member count
    if (members.length < event.minTeamSize) {
      setError(`Minimum team size is ${event.minTeamSize}`);
    } else if (members.length > event.maxTeamSize) {
      setError(`Maximum team size is ${event.maxTeamSize}`);
    } else {
      setError(null);
    }
    
    setMembersInput(e.target.value);
    setParticipant({
      ...participant,
      members: members,
      teamSize: members.length,
    });
  };

  const handleTeamMemberNamesChange = (e) => {
    let memberNames = e.target.value
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "");
    
    // For solo events, just use the entered name
    if (event.minTeamSize <= 1) {
      memberNames = memberNames.length > 0 ? memberNames : [user.name];
    } else {
      // For team events, add the leader's name
      memberNames = [...memberNames, user.name];
      memberNames = [...new Set(memberNames)];
    }
    
    console.log("Team member names changed:", {
      input: e.target.value,
      processed: memberNames,
      isTeam: event.minTeamSize > 1,
      teamSize: event.minTeamSize > 1 ? memberNames.length : participant.members.length
    });
    
    setMemberNamesInput(e.target.value);
    setParticipant({
      ...participant,
      teamMemberNames: memberNames,
      // For team events, team size should be based on the number of names entered
      teamSize: event.minTeamSize > 1 ? memberNames.length : participant.members.length,
    });
  };

  const handleRemoveMember = (index) => {
    let members = participant.members.filter((_, i) => i !== index);
    let memberNames = participant.teamMemberNames.filter((_, i) => i !== index);
    
    if (event.minTeamSize > 1) {
      // For team events, add back the leader
      members = [...members, user._id];
      memberNames = [...memberNames, user.name];
      members = [...new Set(members)];
      memberNames = [...new Set(memberNames)];
    } else {
      // For solo events, ensure at least one name remains
      if (memberNames.length === 0) {
        memberNames = [user.name];
      }
    }
    
    setMembersInput(members.join(", "));
    setMemberNamesInput(memberNames.join(", "));
    setParticipant({
      ...participant,
      members: members,
      teamMemberNames: memberNames,
      // For team events, team size should be based on the number of names
      teamSize: event.minTeamSize > 1 ? memberNames.length : members.length,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  if (event.registrationFeesInINR > 0) {
    // Paid event → open payment modal directly
    setShowPaymentModal(true);
  } else {
    try {
      // Recompute members/names/size from latest inputs to avoid stale state
      let members = [];
      // If the user typed member IDs in textarea, parse that
      if (membersInput && typeof membersInput === "string") {
        const parsed = membersInput
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);
        if (parsed.length > 0) members = [...parsed];
      }
      // Ensure leader is present
      members = [...new Set([...(members || []), user._id])];

      // Team member names
      let teamMemberNames = [];
      if (memberNamesInput && typeof memberNamesInput === "string") {
        const parsedNames = memberNamesInput
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
        if (parsedNames.length > 0) teamMemberNames = [...parsedNames];
      }
      // Ensure leader's name present
      teamMemberNames = [...new Set([...(teamMemberNames || []), user.name])];

      // Team size should always be based on members count
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
      // Recompute members/names/size before sending (same logic as submit)
      let members = [];
      if (membersInput && typeof membersInput === "string") {
        const parsed = membersInput
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);
        if (parsed.length > 0) members = [...parsed];
      }
      members = [...new Set([...(members || []), user._id])];

      let teamMemberNames = [];
      if (memberNamesInput && typeof memberNamesInput === "string") {
        const parsedNames = memberNamesInput
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
        if (parsedNames.length > 0) teamMemberNames = [...parsedNames];
      }
      teamMemberNames = [...new Set([...(teamMemberNames || []), user.name])];

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
                value={membersInput}
                placeholder="Enter comma separated IDs of your team members."
                disabled={pendingVerification}
              />
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
              value={memberNamesInput}
              placeholder={event.minTeamSize > 1 ? "Enter comma separated names of your team members." : "Enter your name"}
              disabled={pendingVerification}
            />
            <div className={styles.members}>
              {participant.teamMemberNames.map((memberName, index) => (
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
            {participant.teamMemberNames.length > 0 && (
              <div className={styles.teamInfo}>
                <p className={styles.teamCount}>
                  Total Team Members: <strong>{participant.teamMemberNames.length}</strong>
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
              (event.minTeamSize > 1 &&
                participant.members.length < event.minTeamSize) ||
              (event.minTeamSize > 1 &&
                participant.members.length > event.maxTeamSize) ||
              !participant.teamName ||
              !participant.teamMemberNames ||
              participant.teamMemberNames.length === 0 ||
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
