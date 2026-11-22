export const DateRanges = ["recent", "hour", "day", "week", "month", "year", "all"] as const;
export type DateRange = (typeof DateRanges)[number];

export const SortOrders = ["asc", "desc"] as const;
export type SortOrder = (typeof SortOrders)[number];

export const CheckFilters = ["all", "up", "down", "resolve", "degraded"] as const;
export type CheckFilter = (typeof CheckFilters)[number];
