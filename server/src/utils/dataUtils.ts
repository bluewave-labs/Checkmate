import { type DateRange } from "@/types/query.js";

export const getDateForRange = (dateRange: DateRange): Date => {
	const now = Date.now();
	switch (dateRange) {
		case "recent":
			return new Date(now - 2 * 60 * 60 * 1000); // 2 hours
		case "hour":
			return new Date(now - 60 * 60 * 1000); // 1 hour
		case "day":
			return new Date(now - 24 * 60 * 60 * 1000); // 1 day
		case "week":
			return new Date(now - 7 * 24 * 60 * 60 * 1000); // 7 days
		case "month":
			return new Date(now - 30 * 24 * 60 * 60 * 1000); // 30 days
		case "all":
			return new Date(0);
		default:
			return new Date(0);
	}
};

export const getDateFormat = (dateRange: DateRange): string => {
	const formatLookup = {
		hour: "%Y-%m-%dT%H:%M:00Z",
		recent: "%Y-%m-%dT%H:%M:00Z",
		day: "%Y-%m-%dT%H:00:00Z",
		week: "%Y-%m-%dT00:00:00Z",
		month: "%Y-%m-%dT00:00:00Z",
		all: "%Y-%m-%dT00:00:00Z",
	};
	return formatLookup[dateRange];
};
