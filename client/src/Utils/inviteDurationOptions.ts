export const DEFAULT_INVITE_DURATION_HOURS = 1;
export const MIN_INVITE_DURATION_HOURS = 1;
export const MAX_INVITE_DURATION_HOURS = 24 * 30; // 30 days

export interface InviteDurationOption {
	hours: number;
	labelKey: string;
}

export const INVITE_DURATION_OPTIONS: InviteDurationOption[] = [
	{ hours: 1, labelKey: "oneHour" },
	{ hours: 24, labelKey: "oneDay" },
	{ hours: 24 * 3, labelKey: "threeDays" },
	{ hours: 24 * 7, labelKey: "oneWeek" },
	{ hours: 24 * 30, labelKey: "thirtyDays" },
];
