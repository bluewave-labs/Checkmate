import type { Notification } from "@/domain/notifications/notification.type.js";
import type { NotificationMessage } from "@/domain/notifications/notification.type.js";
import { ILogger } from "@/utils/logger/logger.js";
import type { OptionsOfJSONResponseBody } from "got";

export const DEFAULT_NOTIFICATION_TIMEOUT_MS = 30_000;
export interface INotificationProvider {
	sendMessage: (notification: Notification, message: NotificationMessage) => Promise<boolean>;
	sendTestAlert(notification: Partial<Notification>): Promise<boolean>;
}

export abstract class NotificationProvider implements INotificationProvider {
	protected abstract readonly serviceName: string;
	protected readonly timeoutMs: number;
	private readonly rootLogger: ILogger;
	private childLogger: ILogger | undefined;

	constructor(logger: ILogger, timeoutMs: number = DEFAULT_NOTIFICATION_TIMEOUT_MS) {
		this.rootLogger = logger;
		this.timeoutMs = timeoutMs;
	}

	// Created on first use: a subclass's serviceName isn't set yet while this constructor runs
	protected get logger(): ILogger {
		this.childLogger ??= this.rootLogger.child({ service: this.serviceName });
		return this.childLogger;
	}

	protected gotRequestOptions(): Pick<OptionsOfJSONResponseBody, "timeout" | "retry"> {
		return {
			timeout: { request: this.timeoutMs },
			retry: { limit: 0 },
		};
	}

	abstract sendMessage(notification: Notification, message: NotificationMessage): Promise<boolean>;
	abstract sendTestAlert(notification: Partial<Notification>): Promise<boolean>;
}
