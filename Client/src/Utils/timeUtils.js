export const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let dateStr = "";

  days && (dateStr += `${days}d `);
  hours && (dateStr += `${hours % 24}h `);
  minutes && (dateStr += `${minutes % 60}m `);
  seconds && (dateStr += `${seconds % 60}s `);

  dateStr === "" && (dateStr = "0s");

  return dateStr;
};

export const formatDurationRounded = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let time = "";
  if (days > 0) {
    time += `${days} day${days !== 1 ? "s" : ""}`;
    return time;
  }
  if (hours > 0) {
    time += `${hours} hour${hours !== 1 ? "s" : ""}`;
    return time;
  }
  if (minutes > 0) {
    time += `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    return time;
  }
  if (seconds > 0) {
    time += `${seconds} second${seconds !== 1 ? "s" : ""}`;
    return time;
  }

  return time;
};

export const formatDurationSplit = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return days > 0
    ? { time: days, format: days === 1 ? "day" : "days" }
    : hours > 0
    ? { time: hours, format: hours === 1 ? "hour" : "hours" }
    : minutes > 0
    ? { time: minutes, format: minutes === 1 ? "minute" : "minutes" }
    : seconds > 0
    ? { time: seconds, format: seconds === 1 ? "second" : "seconds" }
    : { time: 0, format: "seconds" };
};

export const formatDate = (date, customOptions) => {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    ...customOptions,
  };

  // Return the date using the specified options
  return date
    .toLocaleString("en-US", options)
    .replace(/\b(AM|PM)\b/g, (match) => match.toLowerCase());
};
