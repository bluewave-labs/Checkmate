/**
 * Constants for Status Page functionality
 * Central location for all status page related configuration values
 */

// Date range options for charts and data fetching
export const DATE_RANGES = {
	RECENT: "recent",
	HOUR: "hour",
	DAY: "day",
	WEEK: "week",
	MONTH: "month",
	ALL: "all",
};

// Default values for status page configuration
export const STATUS_PAGE_DEFAULTS = {
	showResponseTimeChart: false,
	showCharts: true,
	showUptimePercentage: true,
	showAdminLoginLink: false,
};

// API configuration constants
export const API_CONFIG = {
	NORMALIZE_RESPONSE: true,
};

// UI spacing and layout constants
export const CHART_SPACING = {
	TOP_MARGIN: 4,
};
