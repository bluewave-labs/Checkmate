export const NotificationChannels = [
	"email",
	"slack",
	"discord",
	"webhook",
	"pager_duty",
	"matrix",
	"teams",
	"telegram",
	"pushover",
	"twilio",
	"ntfy",
] as const;
export type NotificationChannel = (typeof NotificationChannels)[number];

export interface Notification {
	id: string;
	userId: string;
	teamId: string;
	type: NotificationChannel;
	notificationName: string;
	address?: string;
	phone?: string;
	homeserverUrl?: string;
	roomId?: string;
	accessToken?: string;
	accountSid?: string;
	twilioPhoneNumber?: string;
	topic?: string;
	webhookAuthType?: 'none' | 'basic' | 'bearer';
	webhookUsername?: string;
	webhookPassword?: string;
	webhookToken?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AlertPagerDutyPayload {
	routing_key?: string;
	dedup_key?: string;
	event_action?: "trigger" | "resolve";
	payload: Record<string, unknown>;
}

export interface AlertMatrixPayload {
	plainText: string;
	htmlText: string;
}

export interface DiscordEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

export interface AlertDiscordPayload {
	title: string;
	description: string;
	color: number;
	fields: DiscordEmbedField[];
	timestamp: string;
}

/**
 * Unified notification message types for cross-provider consistency
 * Part of notification system unification effort
 */

export type NotificationType = "monitor_down" | "monitor_up" | "threshold_breach" | "threshold_resolved" | "test";

export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export interface MonitorInfo {
	id: string;
	name: string;
	url: string;
	type: string;
	status: string;
}

export interface ThresholdBreach {
	metric: "cpu" | "memory" | "disk" | "temp";
	currentValue: number;
	threshold: number;
	unit: string;
	formattedValue: string; // e.g., "85%" or "72°C"
}

export interface IncidentInfo {
	id: string;
	url: string;
	createdAt: Date;
	resolvedAt?: Date;
	duration?: string;
}

export interface NotificationContent {
	title: string;
	summary: string;
	details?: string[];
	thresholds?: ThresholdBreach[];
	incident?: IncidentInfo;
	timestamp: Date;
}

export interface NotificationMessage {
	type: NotificationType;
	severity: NotificationSeverity;
	monitor: MonitorInfo;
	content: NotificationContent;
	clientHost: string;
	metadata: {
		teamId: string;
		notificationReason: string;
	};
}
