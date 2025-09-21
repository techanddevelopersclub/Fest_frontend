import { useState, useEffect } from "react";
import QRCode from "../../../../components/QRCode/QRCode";
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
  });
  const [error, setError] = useState(null);
  const [membersInput, setMembersInput] = useState("");
  const [createParticipant, { isLoading }] = useCreateParticipantMutation();
  const [promoCode, setPromoCode] = useState("");
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
    if (members.length < event.minTeamSize) {
      setError(`Minimum team size is ${event.minTeamSize}`);
    } else if (members.length >= event.maxTeamSize) {
      // equal because leader is also a member
      setError(`Maximum team size is ${event.maxTeamSize}`);
    } else {
      setError(null);
    }
    setMembersInput(e.target.value);
    setParticipant({
      ...participant,
      members: members,
    });
  };

  const handleRemoveMember = (index) => {
    let members = participant.members.filter((_, i) => i !== index);
    members = [...members, user._id];
    members = [...new Set(members)];
    setMembersInput(members.join(", "));
    setParticipant({
      ...participant,
      members: members,
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
await createParticipant({
  participant: {
    event: event._id,
    leader: user._id,
    isTeam: event.minTeamSize > 1,
    teamName: participant.teamName,
    members: participant.members,
  },
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
    const amount = event.registrationFeesInINR || 1;
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
      await createPendingParticipant({
        event: event._id,
        leader: user._id,
        isTeam: event.minTeamSize > 1,
        teamName: participant.teamName,
        members: participant.members,
        paymentProofUrl: uploadedFileUrl,
      }).unwrap();
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
      <Modal title={event.name} close={close}>
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
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          {event.minTeamSize > 1 && (
            <div className={styles.formGroup}>
              <label htmlFor="teamName">Team Name</label>
              <input
                type="text"
                name="teamName"
                id="teamName"
                required
                className={styles.input}
                onChange={handleChange}
                disabled={pendingVerification}
              />
            </div>
          )}
          {event.minTeamSize > 1 && (
            <div className={styles.formGroup}>
              <label htmlFor="teamMembers">Team Members</label>
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
              <div className={styles.members}>
                {participant.members.map((member, index) => (
                  <div className={styles.member} key={index}>
                    <div className={styles.name}>{member}</div>
                    <button
                      className={styles.remove}
                      onClick={() => handleRemoveMember(index)}
                      disabled={pendingVerification}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                participant.members.length >= event.maxTeamSize) ||
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
            <p>Scan this QR to pay via UPI:</p>
            <QRCode data={getUpiLink()} height={220} width={220} />
            <p style={{ marginTop: 10 }}>Or use this link:</p>
            <a href={getUpiLink()} target="_blank" rel="noopener noreferrer" style={{ color: "violet" }}>Pay Here</a>
            <div style={{ marginTop: 20 }}>
              <label>Upload payment proof (screenshot/pdf):</label>
              <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload}  style={{ marginTop: 10 }} disabled={pendingVerification} />
              {uploadedFileUrl && (
                <div style={{ marginTop: 10 }}>
                  <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" >View Uploaded File</a>
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
