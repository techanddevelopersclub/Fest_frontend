import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card/Card";
import styles from "./Dashboard/Dashboard.module.css";
import {
  useListPendingParticipantsQuery,
  useVerifyPendingParticipantMutation,
  useRejectPendingParticipantMutation,
} from "../../../state/redux/pendingParticipants/pendingParticipantsApi";
import {
  useListPendingEntryPassesQuery,
  useVerifyPendingEntryPassMutation,
  useRejectPendingEntryPassMutation,
} from "../../../state/redux/pendingEntryPass/pendingEntryPassApi";
import { Button } from "../../../components/AdminCommons/ui/button";
import Modal from "../../../apps/client/components/Modal/Modal";

const PaymentVerification = () => {
  const [activeTab, setActiveTab] = useState("participants");
  const [eventFilter, setEventFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const participantsParams = useMemo(() => ({ q: search || undefined, page, limit }), [search, page]);
  const entryPassParams = useMemo(() => ({ page, limit }), [page]);

  const { data: pData, refetch: refetchP, error: pError, isLoading: pLoading } = useListPendingParticipantsQuery(participantsParams);
  const { data: eData, refetch: refetchE, error: eError, isLoading: eLoading } = useListPendingEntryPassesQuery(entryPassParams);

  // Debug logging
  console.log("🔍 PaymentVerification - pData:", pData);
  console.log("🔍 PaymentVerification - eData:", eData);
  console.log("🔍 PaymentVerification - pError:", pError);
  console.log("🔍 PaymentVerification - eError:", eError);
  console.log("🔍 PaymentVerification - pLoading:", pLoading);
  console.log("🔍 PaymentVerification - eLoading:", eLoading);
  const [verifyParticipant] = useVerifyPendingParticipantMutation();
  const [rejectParticipant] = useRejectPendingParticipantMutation();
  const [verifyEntryPass] = useVerifyPendingEntryPassMutation();
  const [rejectEntryPass] = useRejectPendingEntryPassMutation();

  const [modal, setModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setPage(1);
  }, [eventFilter, search]);

  const handleVerify = async (id, type) => {
    const confirmed = window.confirm("Are you sure you want to verify this payment?");
    if (!confirmed) return;
    if (type === "participant") {
      await verifyParticipant(id);
      refetchP();
    } else {
      await verifyEntryPass(id);
      refetchE();
    }
  };

  const handleReject = async (id, type) => {
    if (!rejectReason.trim()) return;
    if (type === "participant") {
      await rejectParticipant({ id, reason: rejectReason });
      refetchP();
    } else {
      await rejectEntryPass({ id, reason: rejectReason });
      refetchE();
    }
    setModal(null);
    setRejectReason("");
  };

  const renderTable = (rows, type) => (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "center" }}>User</th>
          <th style={{ textAlign: "center" }}>Event</th>
          {type === "participant" && <th style={{ textAlign: "center" }}>Team</th>}
          <th style={{ textAlign: "center" }}>Amount</th>
          <th style={{ textAlign: "center" }}>Proof</th>
          <th style={{ textAlign: "center" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {(!rows || rows.length === 0) ? (
          <tr><td colSpan={type === "participant" ? 6 : 5} style={{ textAlign: "center" }}>No records</td></tr>
        ) : rows.map((r) => (
          <tr key={r._id}>
            <td style={{ textAlign: "center" }}>
              {type === "participant"
                ? ((r.leader?.name) ?? r.leader)
                : (() => {
                    const name = r.user?.name ?? r.user;
                    const email = r.user?.email ? ` (${r.user.email})` : "";
                    return `${name}${email}`;
                  })()}
            </td>
            <td style={{ textAlign: "center" }}>{r.event?.name || r.event}</td>
            {type === "participant" && <td style={{ textAlign: "center" }}>{r.teamName || "-"}</td>}
            <td style={{ textAlign: "center" }}>
              {type === "participant"
                ? (r.event?.registrationFeesInINR ?? "-")
                : (r.event?.entryPassPriceInINR ?? "-")}
            </td>
            <td style={{ textAlign: "center" }}>
              <a href={r.paymentProofUrl} target="_blank" rel="noreferrer">View</a>
            </td>
            <td style={{ textAlign: "center" }}>
              <Button onClick={() => handleVerify(r._id, type)}>Verify</Button>
              <Button onClick={() => setModal({ id: r._id, type })} variant="danger">Reject</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const pItemsRaw = Array.isArray(pData?.items) ? pData.items : (Array.isArray(pData) ? pData : []);
  const eItemsRaw = Array.isArray(eData?.items) ? eData.items : (Array.isArray(eData) ? eData : []);

  // Filter by event name on frontend
  const pItems = eventFilter
    ? pItemsRaw.filter(item => (item.event?.name || "").toLowerCase().includes(eventFilter.toLowerCase()))
    : pItemsRaw;
  const eItems = eventFilter
    ? eItemsRaw.filter(item => (item.event?.name || "").toLowerCase().includes(eventFilter.toLowerCase()))
    : eItemsRaw;

  return (
    <div className={styles.page}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Payment Verification</h2>
          <div>
            <Button onClick={() => setActiveTab("participants")} variant={activeTab === "participants" ? "default" : "secondary"}>Participants</Button>
            <Button onClick={() => setActiveTab("entryPasses")} variant={activeTab === "entryPasses" ? "default" : "secondary"} style={{ marginLeft: 8 }}>Entry Passes</Button>
          </div>
        </div>
        
        {/* Debug Information */}
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8, fontSize: 12 }}>
          <div><strong>Debug Info:</strong></div>
          <div>Participants Loading: {String(pLoading)} | Error: {pError ? pError.message : "None"}</div>
          <div>Entry Passes Loading: {String(eLoading)} | Error: {eError ? eError.message : "None"}</div>
          <div>Participants Data: {pData ? (Array.isArray(pData) ? pData.length : Object.keys(pData).length) : "null"} items</div>
          <div>Entry Passes Data: {eData ? (Array.isArray(eData) ? eData.length : Object.keys(eData).length) : "null"} items</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input
            placeholder="Filter by Event Name"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            style={{
              flex: 1,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          />
          <input
            placeholder="Search team name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          />
        </div>
        <div style={{
          border: "1px solid hsl(var(--border))",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {activeTab === "participants" ? renderTable(pItems, "participant") : renderTable(eItems, "entryPass")}
        </div>
      </Card>

      {modal && (
        <Modal title="Reject Payment" close={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 14, opacity: 0.9 }}>Reason for rejection</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                borderRadius: 8,
                padding: "10px 12px",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => setModal(null)} variant="secondary">Cancel</Button>
              <Button onClick={() => handleReject(modal.id, modal.type)} variant="destructive" disabled={!rejectReason.trim()}>Submit</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentVerification;

