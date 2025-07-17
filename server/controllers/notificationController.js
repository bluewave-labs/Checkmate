import { createNotificationBodyValidation } from "../validation/joi.js";
import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "NotificationController";

class NotificationController {
	constructor({ notificationService, stringService, statusService, db }) {
		this.notificationService = notificationService;
		this.stringService = stringService;
		this.statusService = statusService;
		this.db = db;
	}

	testNotification = asyncHandler(
		async (req, res, next) => {
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
		},
		SERVICE_NAME,
		"testNotification"
	);

	createNotification = asyncHandler(
		async (req, res, next) => {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});

			const body = req.body;
			const { _id, teamId } = req.user;
			body.userId = _id;
			body.teamId = teamId;
			const notification = await this.db.createNotification(body);
			return res.success({
				msg: "Notification created successfully",
				data: notification,
			});
		},
		SERVICE_NAME,
		"createNotification"
	);

	getNotificationsByTeamId = asyncHandler(
		async (req, res, next) => {
			const notifications = await this.db.getNotificationsByTeamId(req.user.teamId);
			return res.success({
				msg: "Notifications fetched successfully",
				data: notifications,
			});
		},
		SERVICE_NAME,
		"getNotificationsByTeamId"
	);

	deleteNotification = asyncHandler(
		async (req, res, next) => {
			await this.db.deleteNotificationById(req.params.id);
			return res.success({
				msg: "Notification deleted successfully",
			});
		},
		SERVICE_NAME,
		"deleteNotification"
	);

	getNotificationById = asyncHandler(
		async (req, res, next) => {
			const notification = await this.db.getNotificationById(req.params.id);
			return res.success({
				msg: "Notification fetched successfully",
				data: notification,
			});
		},
		SERVICE_NAME,
		"getNotificationById"
	);

	editNotification = asyncHandler(
		async (req, res, next) => {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});

			const notification = await this.db.editNotification(req.params.id, req.body);
			return res.success({
				msg: "Notification updated successfully",
				data: notification,
			});
		},
		SERVICE_NAME,
		"editNotification"
	);

	testAllNotifications = asyncHandler(
		async (req, res, next) => {
			const { monitorId } = req.body;
			const monitor = await this.db.getMonitorById(monitorId);
			const notifications = monitor.notifications;
			if (notifications.length === 0) throw new Error("No notifications");
			const result = await this.notificationService.testAllNotifications(notifications);
			if (!result) throw new Error("Failed to send all notifications");
			return res.success({
				msg: "All notifications sent successfully",
			});
		},
		SERVICE_NAME,
		"testAllNotifications"
	);
}

export default NotificationController;
