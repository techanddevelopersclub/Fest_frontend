import { useState, useEffect } from "react";
import styles from "./Input.module.css";
import { Input } from "../ui/input";
import { convertUTCToLocalDateTime } from "../../../utils/time";

const DateTime = ({
  label,
  name,
  validations,
  onValidation,
  onChange,
  defaultValue,
  readOnly,
  timezone = "Asia/Kolkata", // Default to IST
}) => {
  const [error, setError] = useState("");
  
  // Convert UTC defaultValue to local datetime in the specified timezone
  const getLocalDateTime = (utcValue) => {
    if (!utcValue) return "";
    try {
      // If it's already a datetime-local string, return as is
      if (typeof utcValue === "string" && utcValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
        return utcValue;
      }
      // Otherwise, convert from UTC ISO string to local datetime
      return convertUTCToLocalDateTime(utcValue, timezone);
    } catch (error) {
      console.error("Error converting UTC to local datetime:", error);
      return "";
    }
  };
  
  const [datetime, setDateTime] = useState(() => {
    if (defaultValue) {
      return getLocalDateTime(defaultValue);
    }
    return "";
  });

  // Update when defaultValue or timezone changes
  useEffect(() => {
    if (defaultValue) {
      const localValue = getLocalDateTime(defaultValue);
      setDateTime(localValue);
    } else if (!defaultValue && datetime) {
      // Clear datetime if defaultValue is cleared
      setDateTime("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, timezone]);

  const validate = () => {
    let isValid = true;
    if (validations?.required && !datetime) {
      setError(`${label} is required`);
      isValid = false;
    }
    if (onValidation) onValidation(isValid);
    if (isValid) setError("");
    return isValid;
  };

  return (
    <div className={styles.group}>
      <label className={styles.label}>{label}</label>
      <Input
        type="datetime-local"
        name={name}
        value={datetime}
        onChange={(e) => {
          setDateTime(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        onBlur={validate}
        required={validations?.required}
        readOnly={readOnly}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default DateTime;
