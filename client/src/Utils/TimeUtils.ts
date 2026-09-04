import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import prettyMilliseconds from "pretty-ms";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(duration);

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const MS_PER_WEEK = MS_PER_DAY * 7;

const resolveSystemTimezone = (): string => {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch {
		return "UTC";
	}
};

export const SYSTEM_TIMEZONE = resolveSystemTimezone();

export const resolveTimezone = (preferred?: string | null): string =>
	preferred?.trim() || SYSTEM_TIMEZONE;

export const formatDateWithTz = (
	timestamp: string,
	format: string,
	timezone?: string
) => {
	if (!timestamp) {
		return "Unknown time";
	}
	const tz = resolveTimezone(timezone);
	try {
		return dayjs(timestamp).tz(tz).format(format);
	} catch {
		return dayjs(timestamp).utc().format(format);
	}
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

const DISPLAY_UNITS = [MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND];

// pretty-ms floors seconds-and-above and truncates fractional ms, so values
// must be rounded to their display unit first to land on the nearest whole
// unit (53.6 → "54 ms", 1937 → "2 s", 59500 → "1 m").
const roundToDisplayUnit = (ms: number): number => {
	for (const unit of DISPLAY_UNITS) {
		if (ms >= unit) return Math.round(ms / unit) * unit;
	}
	return ms >= 1 ? Math.round(ms) : ms;
};

export const formatMs = (ms: number, hasSpace: boolean = true): string => {
	const formatted = prettyMilliseconds(roundToDisplayUnit(ms), {
		compact: true,
		formatSubMilliseconds: true,
		secondsDecimalDigits: 0,
	});

	if (hasSpace) {
		return formatted.replace(/^(\d+)(\D+)$/, "$1 $2");
	}
	return formatted;
};

type DurationUnit = "day" | "hour" | "minute" | "second";

interface FormatDurationOptions {
	long?: boolean;
	relative?: boolean;
	hasSpace?: boolean;
	locale?: string;
}

const DURATION_UNITS: Array<{ unit: DurationUnit; milliseconds: number }> = [
	{ unit: "day", milliseconds: MS_PER_DAY },
	{ unit: "hour", milliseconds: MS_PER_HOUR },
	{ unit: "minute", milliseconds: MS_PER_MINUTE },
	{ unit: "second", milliseconds: MS_PER_SECOND },
];

const getDurationUnit = (ms: number) =>
	DURATION_UNITS.find(({ milliseconds }) => Math.abs(ms) >= milliseconds) ??
	DURATION_UNITS[DURATION_UNITS.length - 1];

export const formatDuration = (
	ms: number,
	{ long = false, relative = false, hasSpace = true, locale }: FormatDurationOptions = {}
): string => {
	if (long || relative) {
		const { unit, milliseconds } = getDurationUnit(ms);
		const value = Math.sign(ms) * Math.floor(Math.abs(ms) / milliseconds);

		if (relative) {
			return new Intl.RelativeTimeFormat(locale, {
				numeric: "always",
				style: long ? "long" : "narrow",
			}).format(-value, unit);
		}

		return new Intl.NumberFormat(locale, {
			style: "unit",
			unit,
			unitDisplay: "long",
		}).format(value);
	}

	const formatted = prettyMilliseconds(ms, {
		unitCount: 2,
		secondsDecimalDigits: 0,
		millisecondsDecimalDigits: 0,
	});

	if (hasSpace) {
		return formatted.replace(/^(\d+)(\D+)$/, "$1 $2");
	}
	return formatted;
};

export const enumerateDays = (days: number, timeZone: string): string[] => {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const [year, month, day] = formatter.format(new Date()).split("-").map(Number);
	const todayUtc = Date.UTC(year, month - 1, day);
	const DAY_MS = 24 * 60 * 60 * 1000;
	return Array.from({ length: days }, (_, i) =>
		new Date(todayUtc - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10)
	);
};
