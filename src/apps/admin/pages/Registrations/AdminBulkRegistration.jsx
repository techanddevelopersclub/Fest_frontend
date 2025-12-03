import React, { useState, useMemo } from "react";
import styles from "./AdminBulkRegistration.module.css";
import { useGetAllEventsQuery } from "../../../../state/redux/events/eventsApi";
import { useAdminBulkRegisterParticipantsMutation } from "../../../../state/redux/participants/participantsApi";
import { toast } from "../../components/Toast";

const AdminBulkRegistration = () => {
  const [basicDetails, setBasicDetails] = useState({
    name: "",
    college: "",
    mobile: "",
    email: "",
    teamName: "",
    teamMemberNamesInput: "",
  });

  const [selectedEventIds, setSelectedEventIds] = useState([]);

  const {
    data: { events: eventsArr } = {},
    isLoading: eventsLoading,
  } = useGetAllEventsQuery(`
  {
    events [{ _id, name }]
  }
  `);

  const events = useMemo(() => eventsArr || [], [eventsArr]);

  const [adminBulkRegister, { isLoading }] =
    useAdminBulkRegisterParticipantsMutation();

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEvent = (eventId) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = () => {
    if (!events || events.length === 0) return;
    if (selectedEventIds.length === events.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(events.map((e) => e._id || e.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicDetails.name) {
      toast.error("Please enter participant name");
      return;
    }
    if (selectedEventIds.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    const teamMemberNames = (basicDetails.teamMemberNamesInput || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await adminBulkRegister({
        basicDetails: {
          name: basicDetails.name,
          college: basicDetails.college,
          mobile: basicDetails.mobile,
          email: basicDetails.email,
          teamName: basicDetails.teamName,
          teamMemberNames,
        },
        eventIds: selectedEventIds,
      }).unwrap();

      toast.success("Participants registered for selected events");
      setBasicDetails({
        name: "",
        college: "",
        mobile: "",
        email: "",
        teamName: "",
        teamMemberNamesInput: "",
      });
      setSelectedEventIds([]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      toast.error(
        error?.data?.message ||
          "Failed to register participants. Please try again."
      );
    }
  };

  return (
    <div className={styles.container}>
      <h2>Admin Bulk Registration</h2>
      <p className={styles.description}>
        Register a participant (or team) for multiple events at once.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h3>Participant / Team Details</h3>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Name *</span>
              <input
                type="text"
                name="name"
                value={basicDetails.name}
                onChange={handleBasicChange}
                placeholder="Leader / main participant name"
                required
              />
            </label>
            <label className={styles.field}>
              <span>College</span>
              <input
                type="text"
                name="college"
                value={basicDetails.college}
                onChange={handleBasicChange}
                placeholder="College name"
              />
            </label>
            <label className={styles.field}>
              <span>Mobile</span>
              <input
                type="tel"
                name="mobile"
                value={basicDetails.mobile}
                onChange={handleBasicChange}
                placeholder="Phone number"
              />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={basicDetails.email}
                onChange={handleBasicChange}
                placeholder="Email (optional)"
              />
            </label>
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Team Name</span>
              <input
                type="text"
                name="teamName"
                value={basicDetails.teamName}
                onChange={handleBasicChange}
                placeholder="Team name (if applicable)"
              />
            </label>
            <label className={styles.field}>
              <span>Team Member Names</span>
              <textarea
                name="teamMemberNamesInput"
                value={basicDetails.teamMemberNamesInput}
                onChange={handleBasicChange}
                placeholder="Comma-separated names, e.g. Alice, Bob, Charlie"
                rows={3}
              />
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Select Events</h3>
          {eventsLoading ? (
            <p>Loading events...</p>
          ) : !events || events.length === 0 ? (
            <p>No events found.</p>
          ) : (
            <>
              <button
                type="button"
                className={styles.selectAllBtn}
                onClick={handleSelectAll}
              >
                {selectedEventIds.length === events.length
                  ? "Clear Selection"
                  : "Select All Events"}
              </button>
              <div className={styles.eventsList}>
                {events.map((ev) => {
                  const id = ev._id || ev.id;
                  const checked = selectedEventIds.includes(id);
                  return (
                    <label key={id} className={styles.eventItem}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleEvent(id)}
                      />
                      <span>{ev.name}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register for Selected Events"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminBulkRegistration;


