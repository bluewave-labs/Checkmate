import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import customParseFormat from "dayjs/plugin/customParseFormat";
import prettyMilliseconds from "pretty-ms";

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

export const tooltipDateFormatLookup = (range: string): DateFormat =>
	range === "month" ? "date" : "dateTime";

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

const FALLBACK_DURATION_UNIT = DURATION_UNITS[DURATION_UNITS.length - 1];

const getDurationUnit = (ms: number) =>
	DURATION_UNITS.find(({ milliseconds }) => Math.abs(ms) >= milliseconds) ??
	FALLBACK_DURATION_UNIT;

const getExactDurationUnit = (ms: number) =>
	DURATION_UNITS.find(({ milliseconds }) => ms !== 0 && ms % milliseconds === 0) ??
	FALLBACK_DURATION_UNIT;

export const formatDuration = (
	ms: number,
	{ long = false, relative = false, hasSpace = true, locale }: FormatDurationOptions = {}
): string => {
	if (relative) {
		const { unit, milliseconds } = getDurationUnit(ms);
		const value = Math.sign(ms) * Math.floor(Math.abs(ms) / milliseconds);
		return new Intl.RelativeTimeFormat(locale, {
			numeric: "always",
			style: long ? "long" : "narrow",
		}).format(-value, unit);
	}

	if (long) {
		const { unit, milliseconds } = getExactDurationUnit(ms);
		return new Intl.NumberFormat(locale, {
			style: "unit",
			unit,
			unitDisplay: "long",
		}).format(ms / milliseconds);
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

export const DATE_FORMATS = {
	// Wed, Oct 4, 2026, 14:19
	dateTime: {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	},
	// Oct 4, 2026, 14:19:05
	dateTimeSeconds: {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
	},
	// Oct 4, 14:19
	dateTimeShort: { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
	// Oct 4, 2026
	date: { year: "numeric", month: "short", day: "numeric" },
	// Oct 4
	dateShort: { month: "short", day: "numeric" },
	// 14:19
	time: { hour: "numeric", minute: "2-digit" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;
export type DateFormat = keyof typeof DATE_FORMATS;

export const TIME_FORMATS = ["24h", "12h"] as const;
export type TimeFormat = (typeof TIME_FORMATS)[number];

const HOUR_CYCLES = { "12h": "h12", "24h": "h23" } as const;

export const formatDate = (
	value: string | number | Date | null | undefined,
	format: DateFormat,
	options: { timeZone?: string; locale: string; timeFormat: TimeFormat }
): string => {
	if (value === null || value === undefined || value === "") return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleString(options.locale, {
		...DATE_FORMATS[format],
		timeZone: resolveTimezone(options.timeZone),
		hourCycle: HOUR_CYCLES[options.timeFormat],
		calendar: "gregory",
	});
};
