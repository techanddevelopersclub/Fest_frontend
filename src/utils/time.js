export const getGreetings = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
};

export const formatTime = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  } catch (error) {
    return "";
  }
};

export const formatDate = (timestamp, options = {}) => {
  try {
    const date = new Date(timestamp);
    return Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: options.skipYear ? undefined : "numeric",
    }).format(date);
  } catch (error) {
    return "";
  }
};

export const formatDateTime = (date, options = {}) => {
  return `${formatDate(date, options)} - ${formatTime(date)}`;
};

export const ceilHour = (timestamp) => {
  const date = new Date(timestamp);
  date.setMinutes(59);
  date.setSeconds(59);
  date.setMilliseconds(999);
  return date.getTime() + 1;
};

export const floorHour = (timestamp) => {
  const date = new Date(timestamp);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.getTime();
};

export const formatDateTimePassed = (timestamp) => {
  const now = new Date().getTime();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  return formatDate(timestamp);
};

export const formatDateTimeFromNow = (
  timestamp,
  { skipDate = false, prefix = "" } = {}
) => {
  const now = new Date().getTime();
  const diff = timestamp - now;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) {
    return prefix + `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
  if (minutes < 60) {
    return prefix + `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  if (hours < 24) {
    return prefix + `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  if (days < 7) {
    return prefix + `${days} day${days > 1 ? "s" : ""}`;
  }
  return skipDate ? "" : formatDate(timestamp);
};

/**
 * Convert a datetime-local string (YYYY-MM-DDTHH:mm) from a specific timezone to UTC ISO string
 * @param {string} localDateTime - The datetime-local string (e.g., "2024-01-15T10:00")
 * @param {string} timezone - IANA timezone (e.g., "Asia/Kolkata")
 * @returns {string} ISO string in UTC
 */
export const convertLocalDateTimeToUTC = (localDateTime, timezone = "Asia/Kolkata") => {
  if (!localDateTime) return "";
  
  try {
    // Parse the local datetime string
    const [datePart, timePart] = localDateTime.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    
    // Strategy: Find what UTC time would display as our target time in the timezone
    // Then work backwards to find the correct UTC time
    
    // Create a test UTC date
    let testUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    
    // Format this UTC time in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    // Binary search approach: adjust UTC until the formatted timezone time matches our input
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const parts = formatter.formatToParts(testUTC);
      const tzYear = parseInt(parts.find(p => p.type === "year").value);
      const tzMonth = parseInt(parts.find(p => p.type === "month").value);
      const tzDay = parseInt(parts.find(p => p.type === "day").value);
      const tzHour = parseInt(parts.find(p => p.type === "hour").value);
      const tzMinute = parseInt(parts.find(p => p.type === "minute").value);
      
      // Check if we match
      if (tzYear === year && tzMonth === month && tzDay === day && tzHour === hour && tzMinute === minute) {
        return testUTC.toISOString();
      }
      
      // Calculate difference in minutes
      const targetMinutes = hour * 60 + minute;
      const tzMinutes = tzHour * 60 + tzMinute;
      let diffMinutes = targetMinutes - tzMinutes;
      
      // Handle day differences
      if (tzDay !== day) {
        diffMinutes += (day - tzDay) * 24 * 60;
      }
      
      // Adjust the UTC time
      testUTC = new Date(testUTC.getTime() + diffMinutes * 60 * 1000);
      attempts++;
    }
    
    // If binary search didn't work, return the best guess
    return testUTC.toISOString();
  } catch (error) {
    console.error("Error converting local datetime to UTC:", error);
    // Fallback: return as-is (assume already UTC for backward compatibility)
    return new Date(localDateTime).toISOString();
  }
};

/**
 * Convert a UTC ISO string to a datetime-local string in a specific timezone
 * @param {string} utcISOString - ISO string in UTC (e.g., "2024-01-15T04:30:00.000Z")
 * @param {string} timezone - IANA timezone (e.g., "Asia/Kolkata")
 * @returns {string} datetime-local string (YYYY-MM-DDTHH:mm)
 */
export const convertUTCToLocalDateTime = (utcISOString, timezone = "Asia/Kolkata") => {
  if (!utcISOString) return "";
  
  try {
    const date = new Date(utcISOString);
    
    // Format the date in the specified timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;
    const hour = parts.find(p => p.type === "hour").value;
    const minute = parts.find(p => p.type === "minute").value;
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (error) {
    console.error("Error converting UTC to local datetime:", error);
    return "";
  }
};

/**
 * Common timezones list with display names
 */
export const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST) - UTC+5:30" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "America/New_York", label: "Eastern Time (ET) - UTC-5:00" },
  { value: "America/Chicago", label: "Central Time (CT) - UTC-6:00" },
  { value: "America/Denver", label: "Mountain Time (MT) - UTC-7:00" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - UTC-8:00" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET) - UTC+1:00" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST) - UTC+4:00" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT) - UTC+8:00" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST) - UTC+9:00" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET) - UTC+10:00" },
];
