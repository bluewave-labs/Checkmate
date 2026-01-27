import { NotificationChannel } from "@/types/index.js";
export interface AlertWebhookPayload {
	body: Record<string, unknown>;
}

export interface AlertPagerDutyPayload {
	routingKey: string;
	monitorUrl?: string;
}

export interface AlertMatrixPayload {
	friendlyName?: string;
	homeserverUrl: string;
	accessToken: string;
	roomId: string;
	monitorName: string;
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
