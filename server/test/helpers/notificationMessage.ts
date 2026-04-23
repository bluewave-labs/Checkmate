import type { Notification } from "../../src/types/index.ts";
import type { NotificationMessage } from "../../src/types/notificationMessage.ts";

export const makeNotification = (overrides?: Partial<Notification>): Notification =>
	({
		address: "https://hooks.example.com/webhook",
		accessToken: "token-abc",
		homeserverUrl: "https://matrix.example.com",
		roomId: "!room:example.com",
		...overrides,
	}) as Notification;

export const makeMessage = (overrides?: Partial<NotificationMessage>): NotificationMessage => ({
	type: "monitor_down",
	severity: "critical",
	monitor: { id: "mon-1", name: "Test Monitor", url: "https://example.com", type: "http", status: "down" },
	content: {
		title: "Monitor Down: Test Monitor",
		summary: 'Monitor "Test Monitor" is currently down.',
		details: ["URL: https://example.com", "Status: Down"],
		timestamp: new Date("2025-01-01T00:00:00Z"),
	},
	clientHost: "https://app.example.com",
	metadata: { teamId: "team-1", notificationReason: "status_change" },
	...overrides,
});

export const makeMessageWithThresholds = (): NotificationMessage =>
	makeMessage({
		type: "threshold_breach",
		severity: "warning",
		monitor: { id: "mon-1", name: "Infra Server", url: "https://infra.example.com", type: "hardware", status: "up" },
		content: {
			title: "Threshold Exceeded: Infra Server",
			summary: "Thresholds exceeded.",
			details: ["URL: https://infra.example.com"],
			thresholds: [
				{ metric: "cpu", currentValue: 90, threshold: 80, unit: "%", formattedValue: "90.0%" },
				{ metric: "memory", currentValue: 85, threshold: 70, unit: "%", formattedValue: "85.0%" },
			],
			timestamp: new Date("2025-01-01T00:00:00Z"),
		},
	});

export const makeMessageWithIncident = (): NotificationMessage =>
	makeMessage({
		content: {
			...makeMessage().content,
			incident: { id: "inc-1", url: "https://app.example.com/incidents/inc-1", createdAt: new Date("2025-01-01T00:00:00Z") },
		},
	});
