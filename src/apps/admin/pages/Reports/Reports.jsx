import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import styles from "./Reports.module.css";
import { useGetAllEventsQuery } from "../../../../state/redux/events/eventsApi";
import { useGetAllUsersQuery } from "../../../../state/redux/users/usersApi";
import { useGetParticipationsByEventIdQuery } from "../../../../state/redux/participants/participantsApi";
import { useGetEntryPassesByEventQuery } from "../../../../state/redux/entryPass/entryPassApi";
import { exportParticipantsToCSV, exportEntryPassesToCSV, downloadCSV } from "../../../../utils/csvExport";
import { selectAccessToken } from "../../../../state/redux/auth/authSlice";

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

  const tokenFromStore = useSelector(selectAccessToken);

  const { data: usersData } = useGetAllUsersQuery({ limit: 10000, page: 1, search: "" });
  const users = usersData?.users || usersData?.data || [];

  const { data: { participations } = {} } = useGetParticipationsByEventIdQuery(selectedEvent, { skip: !selectedEvent });
  const participants = participations || [];

  const { data: { entryPasses: entryPassesArr } = {} } = useGetEntryPassesByEventQuery(selectedEvent, { skip: !selectedEvent });
  const entryPasses = entryPassesArr || [];

  const handleDownloadEventCSV = () => {
    if (!selectedEvent || !participants || participants.length === 0) {
      alert('No participants found for this event');
      return;
    }
    const csv = exportParticipantsToCSV(participants);
    if (!csv) {
      alert('Failed to generate CSV');
      return;
    }
    downloadCSV(csv, `event_${selectedEvent}_participants.csv`);
  };

  const handleDownloadAllEventsCSV = async () => {
    if (!events || events.length === 0) {
      alert('No events found');
      return;
    }

    try {
      // Get access token from redux store via window.__REDUX_STATE__ fallback or fetch without header (cookie-based)
      // Prefer using current auth token from local store if available
      const token = tokenFromStore || window.__REDUX_STATE__?.auth?.accessToken;
      const baseUrl = import.meta.env.VITE_API_URL || "/api";

      const allParticipants = [];

      for (const ev of events) {
        const eventId = ev._id || ev.id;
        if (!eventId) continue;

        const res = await fetch(`${baseUrl}/participants/event/${eventId}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          // skip this event on error
          continue;
        }

        const data = await res.json();
        // The endpoint may return { participations } or an array directly
        const parts = data?.participations || data?.data || (Array.isArray(data) ? data : []);

        // annotate with event name so CSV can include it if needed
        (parts || []).forEach((p) => {
          p._eventName = ev.name || "";
          allParticipants.push(p);
        });
      }

      if (allParticipants.length === 0) {
        alert('No participants found across events');
        return;
      }

      const csv = exportParticipantsToCSV(allParticipants);
      if (!csv) {
        alert('Failed to generate CSV');
        return;
      }

      downloadCSV(csv, `all_events_participants.csv`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert('Failed to fetch participants for all events');
    }
  };

  const handleDownloadEventPassesCSV = () => {
    if (!selectedEvent || !entryPasses || entryPasses.length === 0) {
      alert('No entry passes found for this event');
      return;
    }
    const csv = exportEntryPassesToCSV(entryPasses);
    if (!csv) {
      alert('Failed to generate CSV');
      return;
    }
    downloadCSV(csv, `event_${selectedEvent}_entry_passes.csv`);
  };

  const handleDownloadUsersCSV = () => {
    if (!users || users.length === 0) return;

    // Build a simple CSV for users (id, name, email, college, mobile)
    const headers = ["User ID", "Name", "Email", "Image URL","Degree","College", "Mobile", "Year of Graduation","Role"];
    const rows = (users || []).map((u) => [
      u._id || u.id || "",
      u.name || "",
      u.email || "",
      u.image || "",
      u.degree || "",
      u.college || u.collegeName || "",
      u.mobile || u.phone || "",
      u.yearOfGraduation || "",
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
          <button onClick={handleDownloadAllEventsCSV} style={{ marginLeft: 8 }}>
            Download All Events Participants CSV
          </button>
        </div>
      </section>

      <section className={styles.block}>
        <h3>Event-wise Entry Passes</h3>
        <div className={styles.controls}>
          <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">Select event</option>
            {events?.map((ev) => (
              <option key={ev._id || ev.id} value={ev._id || ev.id}>
                {ev.name}
              </option>
            ))}
          </select>

          <button onClick={handleDownloadEventPassesCSV} disabled={!selectedEvent}>
            Download Event Entry Passes CSV
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
