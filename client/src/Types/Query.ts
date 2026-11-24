export const DateRanges = [
	"recent",
	"hour",
	"day",
	"week",
	"month",
	"year",
	"all",
] as const;
export type DateRange = (typeof DateRanges)[number];

export const DefaultHeaderDateRanges = [
	"recent",
	"day",
	"week",
	"month",
] as const satisfies readonly DateRange[];

export const UptimeHeaderDateRanges = [
	...DefaultHeaderDateRanges,
	"year",
	"all",
] as const satisfies readonly DateRange[];

export const LongDateRanges = ["year", "all"] as const satisfies readonly DateRange[];

export const isLongDateRange = (dateRange: DateRange): boolean =>
	LongDateRanges.some((range) => range === dateRange);

export const SortOrders = ["asc", "desc"] as const;
export type SortOrder = (typeof SortOrders)[number];
