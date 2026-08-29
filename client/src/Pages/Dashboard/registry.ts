import { MonitorStatusCard } from "./Components/Cards/MonitorStatusCard";
import { CurrentlyDownCard } from "./Components/Cards/CurrentlyDownCard";
import { FailedChecksCard } from "./Components/Cards/FailedChecksCard";
import { RecentIncidentsCard } from "./Components/Cards/RecentIncidentsCard";
import { MonitorsByTypeCard } from "./Components/Cards/MonitorsByTypeCard";
import { CheckmateServerCard } from "./Components/Cards/CheckmateServerCard";

import type { CardDefinition, CardId } from "./cards";

// Declared width is the minimum number of columns a card needs. The grid may
// stretch the last card of a short row; nothing here is a user setting.
export const CARD_REGISTRY: CardDefinition[] = [
	{
		id: "monitorStatus",
		key: "monitorStatus",
		group: "uptime",
		width: 12,
		component: MonitorStatusCard,
	},
	{
		id: "currentlyDown",
		key: "currentlyDown",
		group: "uptime",
		width: 12,
		component: CurrentlyDownCard,
	},
	{
		id: "monitorsByType",
		key: "monitorsByType",
		group: "uptime",
		width: 6,
		component: MonitorsByTypeCard,
	},
	{
		id: "recentIncidents",
		key: "recentIncidents",
		group: "incidents",
		width: 8,
		component: RecentIncidentsCard,
	},
	{
		id: "failedChecks",
		key: "failedChecks",
		group: "checks",
		width: 4,
		component: FailedChecksCard,
	},
	{
		id: "checkmateServer",
		key: "checkmateServer",
		group: "logs",
		width: 4,
		adminOnly: true,
		component: CheckmateServerCard,
	},
];

const BY_ID = new Map<CardId, CardDefinition>(
	CARD_REGISTRY.map((card) => [card.id, card])
);

export const getCard = (id: CardId): CardDefinition | undefined => BY_ID.get(id);
