export const DateRanges = ["recent", "hour", "day", "week", "month", "all"] as const;
export type DateRange = (typeof DateRanges)[number];
