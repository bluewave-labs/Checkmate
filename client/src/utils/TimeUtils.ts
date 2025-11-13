import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(duration);

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const MS_PER_WEEK = MS_PER_DAY * 7;

export const formatDateWithTz = (
  timestamp: string,
  format: string,
  timezone: string
) => {
  if (!timestamp) {
    return "Unknown time";
  }
  const formattedDate = dayjs(timestamp).tz(timezone).format(format);
  return formattedDate;
};

export const tickDateFormatLookup = (range: string) => {
  const tickFormatLookup: Record<string, string> = {
    "2h": "h:mm A",
    "24h": "h:mm A",
    "7d": "MM/D, h:mm A",
    "30d": "ddd. M/D",
  };
  const format = tickFormatLookup[range];
  if (format === undefined) {
    return "";
  }
  return format;
};

export const tooltipDateFormatLookup = (range: string) => {
  const dateFormatLookup: Record<string, string> = {
    "2h": "ddd. MMMM D, YYYY, hh:mm A",
    "24h": "ddd. MMMM D, YYYY, hh:mm A",
    "7d": "ddd. MMMM D, YYYY, hh:mm A",
    "30d": "ddd. MMMM D, YYYY",
  };
  const format = dateFormatLookup[range];
  if (format === undefined) {
    return "";
  }
  return format;
};
