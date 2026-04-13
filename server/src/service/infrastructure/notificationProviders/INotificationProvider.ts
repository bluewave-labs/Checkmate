import type { Notification } from "@/types/index.js";
import type { NotificationMessage } from "@/types/notificationMessage.js";
import { ILogger } from "@/utils/logger.js";
import type { OptionsOfJSONResponseBody } from "got";

export const DEFAULT_NOTIFICATION_TIMEOUT_MS = 30_000;
export interface INotificationProvider {
	sendMessage: (notification: Notification, message: NotificationMessage) => Promise<boolean>;
	sendTestAlert(notification: Partial<Notification>): Promise<boolean>;
}

export abstract class NotificationProvider implements INotificationProvider {
	protected readonly logger: ILogger;
	protected readonly timeoutMs: number;

	constructor(logger: ILogger, timeoutMs: number = DEFAULT_NOTIFICATION_TIMEOUT_MS) {
		this.logger = logger;
		this.timeoutMs = timeoutMs;
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
