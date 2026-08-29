import type { ComponentType } from "react";

// The 12-column grid the dashboard lays cards out on.
//
// Only two widths exist. Cards are half-width by default and pair up down the
// page; a card is full-width only when its content genuinely needs the room,
// which makes the wide cards read as a deliberate signal rather than as an
// inconsistent grid. Width is declared per card type in code and is never a
// user setting.
export const CardWidths = [6, 12] as const;
export type CardWidth = (typeof CardWidths)[number];

export const GRID_COLUMNS = 12;
export const HALF_WIDTH: CardWidth = 6;

// Picker groups mirror the sidebar sections: you look for a card where you
// look for the feature it belongs to.
export const CardGroups = [
	"uptime",
	"infrastructure",
	"incidents",
	"notifications",
	"maintenance",
	"statusPages",
	"checks",
	"logs",
	"settings",
] as const;
export type CardGroup = (typeof CardGroups)[number];

// The Containers card (CARD-SPECS.md #11) is deliberately absent: it needs
// `containerSummary` on the check snapshot, which arrives with the Docker
// monitoring work. Add it here once that lands on develop.
export const CardIds = [
	"monitorStatus",
	"currentlyDown",
	"slowestMonitors",
	"lowestUptime",
	"monitorsByType",
	"monitorsByGroup",
	"recentIncidents",
	"incidentStats",
	"notificationChannels",
	"maintenance",
	"statusPages",
	"failedChecks",
	"busiestServers",
	"checkmateServer",
	"checksOnSchedule",
	"recentErrors",
	"team",
] as const;
export type CardId = (typeof CardIds)[number];

export interface CardDefinition {
	id: CardId;
	/** i18n key fragment under pages.dashboard.cards.<key>. */
	key: string;
	group: CardGroup;
	width: CardWidth;
	/** Hidden from the page and absent from the picker for non-admins. */
	adminOnly?: boolean;
	component: ComponentType;
}

// The cards a fresh dashboard starts with. Chosen so a brand new install still
// shows something real: Checkmate server works with zero monitors.
// Ordered so the declared widths pair into full rows: a card left alone in a
// row is stretched to fill it, so 8- and 4-wide cards are kept adjacent.
export const DEFAULT_CARD_IDS: CardId[] = [
	"monitorStatus",
	"currentlyDown",
	"failedChecks",
	"monitorsByType",
	"recentIncidents",
	"checkmateServer",
];

export const DASHBOARD_CARDS_STORAGE_KEY = "checkmate-dashboard-cards";

/**
 * Poll rates, in ms. Monitor and server figures move continuously; the log ring
 * buffer rotates fast but is expensive to re-read, so it is polled slowly.
 */
export const REFRESH_INTERVAL_MS = 30000;
export const SLOW_REFRESH_INTERVAL_MS = 60000;
