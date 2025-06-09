import {
	triggerNotificationBodyValidation,
	createNotificationBodyValidation,
} from "../validation/joi.js";
import { handleError, handleValidationError } from "./controllerUtils.js";

const SERVICE_NAME = "NotificationController";

const NOTIFICATION_TYPES = {
	WEBHOOK: "webhook",
	TELEGRAM: "telegram",
};

const PLATFORMS = {
	SLACK: "slack",
	DISCORD: "discord",
	TELEGRAM: "telegram",
};

class NotificationController {
	constructor(notificationService, stringService, statusService) {
		this.notificationService = notificationService;
		this.stringService = stringService;
		this.statusService = statusService;
		this.triggerNotification = this.triggerNotification.bind(this);
		this.testWebhook = this.testWebhook.bind(this);
	}

	async triggerNotification(req, res, next) {
		try {
			await triggerNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
				stripUnknown: true,
			});
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const { monitorId, type, platform, config, status = false } = req.body;

			// Create a simplified networkResponse similar to what would come from monitoring
			const networkResponse = {
				monitorId,
				status,
			};

			// Use the statusService to get monitor details and handle status change logic
			// This returns { monitor, statusChanged, prevStatus } exactly like your job queue uses
			const statusResult = await this.statusService.updateStatus(networkResponse);

			if (type === NOTIFICATION_TYPES.WEBHOOK) {
				const notification = {
					type,
					platform,
					config,
				};

				await this.notificationService.sendWebhookNotification(
					statusResult, // Contains monitor, statusChanged, and prevStatus
					notification
				);
			}

			return res.success({
				msg: this.stringService.webhookSendSuccess,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "triggerNotification"));
		}
	}

	createTestNetworkResponse() {
		return {
			monitor: {
				_id: "test-monitor-id",
				name: "Test Monitor",
				url: "https://example.com",
			},
			status: true,
			statusChanged: true,
			prevStatus: false,
		};
	}

	handleTelegramTest(botToken, chatId) {
		if (!botToken || !chatId) {
			return {
				isValid: false,
				error: {
					msg: this.stringService.telegramRequiresBotTokenAndChatId,
					status: 400,
				},
			};
		}

		return {
			isValid: true,
			notification: {
				type: NOTIFICATION_TYPES.WEBHOOK,
				platform: PLATFORMS.TELEGRAM,
				config: { botToken, chatId },
			},
		};
	}

	handleWebhookTest(webhookUrl, platform) {
		if (webhookUrl === null) {
			return {
				isValid: false,
				error: {
					msg: this.stringService.webhookUrlRequired,
					status: 400,
				},
			};
		}

		return {
			isValid: true,
			notification: {
				type: NOTIFICATION_TYPES.WEBHOOK,
				platform: platform,
				config: { webhookUrl },
			},
		};
	}

	async testWebhook(req, res, next) {
		try {
			const { webhookUrl, platform, botToken, chatId } = req.body;

			if (platform === null) {
				return res.error({
					msg: this.stringService.platformRequired,
					status: 400,
				});
			}

			// Platform-specific handling
			const platformHandlers = {
				[PLATFORMS.TELEGRAM]: () => this.handleTelegramTest(botToken, chatId),
				// Default handler for webhook-based platforms (Slack, Discord, etc.)
				default: () => this.handleWebhookTest(webhookUrl, platform),
			};

			const handler = platformHandlers[platform] || platformHandlers.default;
			const handlerResult = handler();

			if (!handlerResult.isValid) {
				return res.error(handlerResult.error);
			}

			const networkResponse = this.createTestNetworkResponse();

			const result = await this.notificationService.sendWebhookNotification(
				networkResponse,
				handlerResult.notification
			);

			if (result && result !== false) {
				return res.success({
					msg: this.stringService.webhookSendSuccess,
				});
			} else {
				return res.error({
					msg: this.stringService.testNotificationFailed,
					status: 400,
				});
			}
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "testWebhook"));
		}
	}

	createNotification = async (req, res, next) => {
		try {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const notification = await this.db.createNotification(req.body);
			return res.success({
				msg: "Notification created successfully",
				data: notification,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "createNotification"));
		}
	};

	getNotificationsByTeamId = async (req, res, next) => {
		try {
			const notifications = await this.db.getNotificationsByTeamId(req.params.teamId);
			return res.success({
				msg: "Notifications fetched successfully",
				data: notifications,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getNotificationsByTeamId"));
		}
	};

	deleteNotification = async (req, res, next) => {
		try {
			await this.db.deleteNotificationById(req.params.id);
			return res.success({
				msg: "Notification deleted successfully",
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteNotification"));
		}
	};
}

export default NotificationController;
