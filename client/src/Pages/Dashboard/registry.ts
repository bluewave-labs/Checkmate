import { MonitorStatusCard } from "./Components/Cards/MonitorStatusCard";
import { CurrentlyDownCard } from "./Components/Cards/CurrentlyDownCard";
import { FailedChecksCard } from "./Components/Cards/FailedChecksCard";
import { RecentIncidentsCard } from "./Components/Cards/RecentIncidentsCard";
import { MonitorsByTypeCard } from "./Components/Cards/MonitorsByTypeCard";
import { MonitorsByGroupCard } from "./Components/Cards/MonitorsByGroupCard";
import { CheckmateServerCard } from "./Components/Cards/CheckmateServerCard";
import { BusiestServersCard } from "./Components/Cards/BusiestServersCard";
import { SlowestMonitorsCard, LowestUptimeCard } from "./Components/Cards/RankingCards";
import {
	IncidentStatsCard,
	NotificationChannelsCard,
	MaintenanceCard,
	StatusPagesCard,
} from "./Components/Cards/SummaryCards";
import {
	ChecksOnScheduleCard,
	RecentErrorsCard,
	TeamCard,
} from "./Components/Cards/AdminCards";

import type { CardDefinition, CardId } from "./cards";

// Declared width is the minimum number of columns a card needs. The grid may
// stretch the last card of a short row; nothing here is a user setting.
//
// Order is the render order, and the order the picker lists them in.
//
// Every card is half-width and pairs up down the page. The grid promotes a
// lone trailing card to full width so the page does not end on a ragged half.
export const CARD_REGISTRY: CardDefinition[] = [
	{
		id: "monitorStatus",
		key: "monitorStatus",
		group: "uptime",
		width: 6,
		component: MonitorStatusCard,
	},
	{
		id: "currentlyDown",
		key: "currentlyDown",
		group: "uptime",
		width: 6,
		component: CurrentlyDownCard,
	},
	{
		id: "failedChecks",
		key: "failedChecks",
		group: "checks",
		width: 6,
		component: FailedChecksCard,
	},
	{
		id: "slowestMonitors",
		key: "slowestMonitors",
		group: "uptime",
		width: 6,
		component: SlowestMonitorsCard,
	},
	{
		id: "lowestUptime",
		key: "lowestUptime",
		group: "uptime",
		width: 6,
		component: LowestUptimeCard,
	},
	{
		id: "monitorsByType",
		key: "monitorsByType",
		group: "uptime",
		width: 6,
		component: MonitorsByTypeCard,
	},
	{
		id: "monitorsByGroup",
		key: "monitorsByGroup",
		group: "uptime",
		width: 6,
		component: MonitorsByGroupCard,
	},
	{
		id: "busiestServers",
		key: "busiestServers",
		group: "infrastructure",
		width: 6,
		component: BusiestServersCard,
	},
	{
		id: "recentIncidents",
		key: "recentIncidents",
		group: "incidents",
		width: 6,
		component: RecentIncidentsCard,
	},
	{
		id: "incidentStats",
		key: "incidentStats",
		group: "incidents",
		width: 6,
		component: IncidentStatsCard,
	},
	{
		id: "notificationChannels",
		key: "notificationChannels",
		group: "notifications",
		width: 6,
		component: NotificationChannelsCard,
	},
	{
		id: "maintenance",
		key: "maintenance",
		group: "maintenance",
		width: 6,
		component: MaintenanceCard,
	},
	{
		id: "statusPages",
		key: "statusPages",
		group: "statusPages",
		width: 6,
		component: StatusPagesCard,
	},
	{
		id: "checkmateServer",
		key: "checkmateServer",
		group: "logs",
		width: 6,
		adminOnly: true,
		component: CheckmateServerCard,
	},
	{
		id: "checksOnSchedule",
		key: "checksOnSchedule",
		group: "logs",
		width: 6,
		adminOnly: true,
		component: ChecksOnScheduleCard,
	},
	{
		id: "recentErrors",
		key: "recentErrors",
		group: "logs",
		width: 6,
		adminOnly: true,
		component: RecentErrorsCard,
	},
	{
		id: "team",
		key: "team",
		group: "settings",
		width: 6,
		adminOnly: true,
		component: TeamCard,
	},
];

const BY_ID = new Map<CardId, CardDefinition>(
	CARD_REGISTRY.map((card) => [card.id, card])
);

export const getCard = (id: CardId): CardDefinition | undefined => BY_ID.get(id);
