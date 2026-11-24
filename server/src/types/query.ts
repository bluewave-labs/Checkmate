export const DateRanges = ["recent", "hour", "day", "week", "month", "all"] as const;
export type DateRange = (typeof DateRanges)[number];
export const RawOnlyDateRanges = ["recent", "hour"] as const satisfies readonly DateRange[];

export const SortOrders = ["asc", "desc"] as const;
export type SortOrder = (typeof SortOrders)[number];

export const CheckFilters = ["all", "up", "down", "resolve", "degraded"] as const;
export type CheckFilter = (typeof CheckFilters)[number];
