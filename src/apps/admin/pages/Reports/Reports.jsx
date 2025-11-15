import React, { useState, useMemo } from "react";
import styles from "./Reports.module.css";
import { useGetAllEventsQuery } from "../../../../state/redux/events/eventsApi";
import { useGetAllUsersQuery } from "../../../../state/redux/users/usersApi";
import { useGetParticipationsByEventIdQuery } from "../../../../state/redux/participants/participantsApi";
import { exportParticipantsToCSV, downloadCSV } from "../../../../utils/csvExport";

const Reports = () => {
  const [selectedEvent, setSelectedEvent] = useState("");

  const {
    data: { events: eventsArr } = {},
  } = useGetAllEventsQuery(`
  {
    events [{ _id, name }]
  }
  `);
  const events = eventsArr || [];

  const { data: usersData } = useGetAllUsersQuery({ limit: 10000, page: 1, search: "" });
  const users = usersData?.users || usersData?.data || [];

  const { data: participantsData } = useGetParticipationsByEventIdQuery(selectedEvent, { skip: !selectedEvent });
  const participants = participantsData?.participants || participantsData || [];

  const handleDownloadEventCSV = () => {
    if (!selectedEvent) return;
    const csv = exportParticipantsToCSV(participants || []);
    downloadCSV(csv, `event_${selectedEvent}_participants.csv`);
  };

  const handleDownloadUsersCSV = () => {
    if (!users || users.length === 0) return;

    // Build a simple CSV for users (id, name, email, college, mobile)
    const headers = ["User ID", "Name", "Email", "College", "Mobile", "Role"];
    const rows = (users || []).map((u) => [
      u._id || u.id || "",
      u.name || "",
      u.email || "",
      u.college || u.collegeName || "",
      u.mobile || u.phone || "",
      u.role || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((field) => {
            const s = String(field || "");
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(",")
      )
      .join("\n");

    downloadCSV(csvContent, `all_users.csv`);
  };

  return (
    <div className={styles.reports}>
      <h2>Reports</h2>

      <section className={styles.block}>
        <h3>Event-wise Participants</h3>
        <div className={styles.controls}>
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">Select event</option>
            {events?.map((ev) => (
              <option key={ev._id || ev.id} value={ev._id || ev.id}>
                {ev.name}
              </option>
            ))}
          </select>

          <button onClick={handleDownloadEventCSV} disabled={!selectedEvent}>
            Download Event Participants CSV
          </button>
        </div>
      </section>

      <section className={styles.block}>
        <h3>All Users</h3>
        <div className={styles.controls}>
          <button onClick={handleDownloadUsersCSV} disabled={!users || users.length === 0}>
            Download All Users CSV
          </button>
        </div>
      </section>
    </div>
  );
};

export default Reports;
