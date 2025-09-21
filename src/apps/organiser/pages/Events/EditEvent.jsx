import { useEffect, useState } from "react";
import styles from "./Events.module.css";
import Card from "../../components/Card/Card";
import {
  useGetEventByIdQuery,
  useUpdateEventMutation,
} from "../../../../state/redux/events/eventsApi";
import EventForm from "./components/EventForm";
import LoadingSpinner from "../../../../components/LoadingSpinner/LoadingSpinner";
import { useParams } from "react-router-dom";
import { toast } from "../../components/Toast";

const EditEvent = () => {
  const { id: eventId } = useParams();
  const { data: { event: initialEvent } = {}, isLoading: initialEventLoading } =
    useGetEventByIdQuery(eventId);
  const [updateEvent, { error }] = useUpdateEventMutation();

  const handleSubmit = (event) => {
    console.log("Submitting event:", event);
    console.log("Event ID:", event._id);
    
    if (!event._id) {
      toast.error("Event ID is missing. Cannot update event.");
      return;
    }
    
    toast.promise(updateEvent(event).unwrap(), {
      pending: "Updating event...",
      success: "Event updated successfully!",
      error: error?.data?.message || error?.message || "Something went wrong",
    });
  };

  return (
    <div className={styles.page}>
      <Card>
        <div className={styles.eventCard}>
          <h4 className={styles.title}>Event Details</h4>
          <p className={styles.subtitle}>
            Enter the details of the event you want to edit.
            {error && <p className={styles.error}>{error?.data?.message}</p>}
          </p>
          <EventForm
            key={initialEvent?._id}
            defaultValue={initialEvent}
            onSubmit={handleSubmit}
          />
        </div>
      </Card>
      <LoadingSpinner isLoading={initialEventLoading} fullScreen={true} />
    </div>
  );
};

export default EditEvent;
