import { NotificationChannel } from "@/types/index.js";
export interface AlertWebhookPayload {
	body: Record<string, unknown>;
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

export interface Alert {
	channel: NotificationChannel;
	address?: string;
	subject: string;
	message: string;
	html?: string;
	discordContent?: Record<string, unknown> | null;
	webhook?: AlertWebhookPayload | null;
	pagerDuty?: AlertPagerDutyPayload | null;
	matrix?: AlertMatrixPayload | null;
}
