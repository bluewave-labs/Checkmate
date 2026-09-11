export const DASHBOARD_CARD_IDS = [
	"monitorStatus",
	"currentlyDown",
	"slowestMonitors",
	"lowestUptime",
	"monitorsByType",
	"monitorsByGroup",
	"busiestServers",
	"recentIncidents",
	"incidentStats",
	"notificationChannels",
	"maintenanceWindows",
	"statusPages",
	"failedChecks",
	"checkmateServer",
	"checkQueue",
	"recentErrors",
	"teamMembers",
] as const;

export type DashboardCardId = (typeof DASHBOARD_CARD_IDS)[number];

export const defaultVisibleCards: Record<DashboardCardId, boolean> = {
	monitorStatus: true,
	currentlyDown: true,
	slowestMonitors: true,
	lowestUptime: true,
	monitorsByType: true,
	monitorsByGroup: true,
	busiestServers: false,
	recentIncidents: false,
	incidentStats: false,
	notificationChannels: false,
	maintenanceWindows: false,
	statusPages: false,
	failedChecks: false,
	checkmateServer: false,
	checkQueue: false,
	recentErrors: false,
	teamMembers: false,
};

export const cardCategories: {
	labelKey: string;
	cards: DashboardCardId[];
}[] = [
	{
		labelKey: "pages.dashboard.modal.categories.uptime",
		cards: [
			"monitorStatus",
			"currentlyDown",
			"slowestMonitors",
			"lowestUptime",
			"monitorsByType",
			"monitorsByGroup",
		],
	},
	{
		labelKey: "pages.dashboard.modal.categories.infrastructure",
		cards: ["busiestServers"],
	},
	{
		labelKey: "pages.dashboard.modal.categories.incidents",
		cards: ["recentIncidents", "incidentStats"],
	},
	{
		labelKey: "pages.dashboard.modal.categories.notifications",
		cards: ["notificationChannels"],
	},
	{
		labelKey: "pages.dashboard.modal.categories.maintenance",
		cards: ["maintenanceWindows"],
	},
	{
		labelKey: "pages.dashboard.modal.categories.statusPages",
		cards: ["statusPages"],
	},
	{
		labelKey: "pages.dashboard.modal.categories.checks",
		cards: ["failedChecks"],
	},
	{
		labelKey: "pages.dashboard.modal.categories.system",
		cards: ["checkmateServer", "checkQueue", "recentErrors"],
	},
	{
		labelKey: "pages.dashboard.modal.categories.settings",
		cards: ["teamMembers"],
	},
];
