import { createNotificationBodyValidation } from "../validation/joi.js";
import BaseController from "./baseController.js";

const SERVICE_NAME = "NotificationController";

class NotificationController extends BaseController {
	constructor({ notificationService, stringService, statusService, db, errorService }) {
		super();
		this.notificationService = notificationService;
		this.stringService = stringService;
		this.statusService = statusService;
		this.db = db;
		this.errorService = errorService;
		this.asyncHandler = errorService.asyncHandler;
	}

	testNotification = this.asyncHandler(
		async (req, res) => {
			const notification = req.body;

			const success = await this.notificationService.sendTestNotification(notification);

			if (!success) {
				throw this.errorService.createServerError("Sending notification failed");
			}

			return res.success({
				msg: "Notification sent successfully",
			});
		},
		SERVICE_NAME,
		"testNotification"
	);

	createNotification = this.asyncHandler(
		async (req, res) => {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});

			const body = req.body;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const userId = req?.user?._id;
			if (!userId) {
				throw this.errorService.createBadRequestError("User ID is required");
			}
			body.userId = userId;
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

	getNotificationsByTeamId = this.asyncHandler(
		async (req, res) => {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const notifications = await this.db.getNotificationsByTeamId(teamId);

			return res.success({
				msg: "Notifications fetched successfully",
				data: notifications,
			});
		},
		SERVICE_NAME,
		"getNotificationsByTeamId"
	);

	deleteNotification = this.asyncHandler(
		async (req, res) => {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const notification = await this.db.getNotificationById(req.params.id);
			if (!notification.teamId.equals(teamId)) {
				throw this.errorService.createAuthorizationError();
			}

			await this.db.deleteNotificationById(req.params.id);
			return res.success({
				msg: "Notification deleted successfully",
			});
		},
		SERVICE_NAME,
		"deleteNotification"
	);

	getNotificationById = this.asyncHandler(
		async (req, res) => {
			const notification = await this.db.getNotificationById(req.params.id);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			if (!notification.teamId.equals(teamId)) {
				throw this.errorService.createAuthorizationError();
			}
			return res.success({
				msg: "Notification fetched successfully",
				data: notification,
			});
		},
		SERVICE_NAME,
		"getNotificationById"
	);

	editNotification = this.asyncHandler(
		async (req, res) => {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const notification = await this.db.getNotificationById(req.params.id);

			if (!notification.teamId.equals(teamId)) {
				throw this.errorService.createAuthorizationError();
			}

			const editedNotification = await this.db.editNotification(req.params.id, req.body);
			return res.success({
				msg: "Notification updated successfully",
				data: editedNotification,
			});
		},
		SERVICE_NAME,
		"editNotification"
	);

	testAllNotifications = this.asyncHandler(
		async (req, res) => {
			const monitorId = req.body.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const monitor = await this.db.getMonitorById(monitorId);

			if (!monitor.teamId.equals(teamId)) {
				throw this.errorService.createAuthorizationError();
			}

			const notifications = monitor.notifications;
			if (notifications.length === 0) throw this.errorService.createBadRequestError("No notifications");
			const result = await this.notificationService.testAllNotifications(notifications);
			if (!result) throw this.errorService.createServerError("Failed to send all notifications");
			return res.success({
				msg: "All notifications sent successfully",
			});
		},
		SERVICE_NAME,
		"testAllNotifications"
	);
}

export default NotificationController;
