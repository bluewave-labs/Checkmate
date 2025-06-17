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

export const getHumanReadableDuration = (ms) => {
	const durationObj = dayjs.duration(ms);

	const parts = {
		days: Math.floor(durationObj.asDays()),
		hours: durationObj.hours(),
		minutes: durationObj.minutes(),
		seconds: durationObj.seconds(),
	};

	const result = [];

	if (parts.days > 0) {
		result.push(`${parts.days}d`);
	}
	if (parts.hours > 0) {
		result.push(`${parts.hours}h`);
	}
	if (result.length < 2 && parts.minutes > 0) {
		result.push(`${parts.minutes}m`);
	}
	if (result.length < 2 && parts.seconds > 0) {
		result.push(`${parts.seconds}s`);
	}

	if (result.length === 0) {
		// fallback for durations < 1s
		return { time: 0, units: "seconds" };
	}

	return { time: result.join(" "), units: null };
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

export const formatDateWithTz = (timestamp, format, timezone) => {
	const formattedDate = dayjs(timestamp).tz(timezone).format(format);
	return formattedDate;
};
