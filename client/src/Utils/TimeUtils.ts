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

export const formatDateWithTz = (timestamp: string, format: string, timezone: string) => {
	if (!timestamp) {
		return "Unknown time";
	}
	const formattedDate = dayjs(timestamp).tz(timezone).format(format);
	return formattedDate;
};

export const tickDateFormatLookup = (range: string) => {
	const tickFormatLookup: Record<string, string> = {
		recent: "h:mm A",
		day: "h:mm A",
		week: "MM/D, h:mm A",
		month: "ddd. M/D",
	};
	const format = tickFormatLookup[range];
	if (format === undefined) {
		return "";
	}
	return format;
};

export const tooltipDateFormatLookup = (range: string) => {
	const dateFormatLookup: Record<string, string> = {
		recent: "ddd. MMMM D, YYYY, hh:mm A",
		day: "ddd. MMMM D, YYYY, hh:mm A",
		week: "ddd. MMMM D, YYYY, hh:mm A",
		month: "ddd. MMMM D, YYYY",
	};
	const format = dateFormatLookup[range];
	if (format === undefined) {
		return "";
	}
	return format;
};

export const formatTimestamp = (timestamp: string | number | null): string => {
	if (!timestamp) return "-";
	const date = new Date(timestamp);
	return date.toLocaleString();
};
