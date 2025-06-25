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
	constructor({ notificationService, stringService, statusService, db }) {
		this.notificationService = notificationService;
		this.stringService = stringService;
		this.statusService = statusService;
		this.db = db;
	}

	testNotification = async (req, res, next) => {
		try {
			const notification = req.body;

			const success = await this.notificationService.sendTestNotification(notification);

			if (!success) {
				return res.error({
					msg: "Sending notification failed",
					status: 400,
				});
			}

			return res.success({
				msg: "Notification sent successfully",
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "testWebhook"));
		}
	};

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
			const body = req.body;
			const { _id, teamId } = req.user;
			body.userId = _id;
			body.teamId = teamId;
			const notification = await this.db.createNotification(body);
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
			const notifications = await this.db.getNotificationsByTeamId(req.user.teamId);
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

	getNotificationById = async (req, res, next) => {
		try {
			const notification = await this.db.getNotificationById(req.params.id);
			return res.success({
				msg: "Notification fetched successfully",
				data: notification,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getNotificationById"));
		}
	};

	editNotification = async (req, res, next) => {
		try {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const notification = await this.db.editNotification(req.params.id, req.body);
			return res.success({
				msg: "Notification updated successfully",
				data: notification,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "editNotification"));
		}
	};

	testAllNotifications = async (req, res, next) => {
		try {
			const { monitorId } = req.body;
			const monitor = await this.db.getMonitorById(monitorId);
			const notifications = monitor.notifications;
			if (notifications.length === 0) throw new Error("No notifications");
			const result = await this.notificationService.testAllNotifications(notifications);
			if (!result) throw new Error("Failed to send all notifications");
			return res.success({
				msg: "All notifications sent successfully",
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "testAllNotifications"));
		}
	};
}

export default NotificationController;
