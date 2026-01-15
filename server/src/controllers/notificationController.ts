import { Request, Response, NextFunction } from "express";

import { createNotificationBodyValidation } from "@/validation/joi.js";
import { AppError } from "@/utils/AppError.js";
import { IMonitorsRepository } from "@/repositories/index.js";

const SERVICE_NAME = "NotificationController";

class NotificationController {
	static SERVICE_NAME = SERVICE_NAME;
	private db: any;
	private notificationService: any;
	private monitorsRepository: IMonitorsRepository;
	constructor(notificationService: any, db: any, monitorsRepository: IMonitorsRepository) {
		this.notificationService = notificationService;
		this.db = db;
		this.monitorsRepository = monitorsRepository;
	}

	get serviceName() {
		return NotificationController.SERVICE_NAME;
	}

	testNotification = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notification = req.body;

			const success = await this.notificationService.sendTestNotification(notification);

			if (!success) {
				throw new AppError({ message: "Sending notification failed", status: 500 });
			}

			return res.status(200).json({
				success: true,
				msg: "Notification sent successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	createNotification = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});

			const body = req.body;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const userId = req?.user?._id;
			if (!userId) {
				throw new AppError({ message: "User ID is required", status: 400 });
			}
			body.userId = userId;
			body.teamId = teamId;

			const notification = await this.db.notificationModule.createNotification(body);
			return res.status(200).json({
				success: true,
				msg: "Notification created successfully",
				data: notification,
			});
		} catch (error) {
			next(error);
		}
	};

	getNotificationsByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const notifications = await this.db.notificationModule.getNotificationsByTeamId(teamId);

			return res.status(200).json({
				success: true,
				msg: "Notifications fetched successfully",
				data: notifications,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const notification = await this.db.notificationModule.getNotificationById(req.params.id);
			if (!notification.teamId.equals(teamId)) {
				throw new AppError({ message: "Unauthorized", status: 403 });
			}

			await this.db.notificationModule.deleteNotificationById(req.params.id);
			return res.status(200).json({
				success: true,
				msg: "Notification deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notification = await this.db.notificationModule.getNotificationById(req.params.id);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			if (!notification.teamId.equals(teamId)) {
				throw new AppError({ message: "Unauthorized", status: 403 });
			}
			return res.status(200).json({
				success: true,
				msg: "Notification fetched successfully",
				data: notification,
			});
		} catch (error) {
			next(error);
		}
	};

	editNotification = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createNotificationBodyValidation.validateAsync(req.body, {
				abortEarly: false,
			});

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const notification = await this.db.notificationModule.getNotificationById(req.params.id);

			if (!notification.teamId.equals(teamId)) {
				throw new AppError({ message: "Unauthorized", status: 403 });
			}

			const editedNotification = await this.db.notificationModule.editNotification(req.params.id, req.body);
			return res.status(200).json({
				success: true,
				msg: "Notification updated successfully",
				data: editedNotification,
			});
		} catch (error) {
			next(error);
		}
	};

	testAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const monitorId = req.body.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const monitor = await this.monitorsRepository.findById(monitorId, teamId);

			const notifications = monitor.notifications;
			if (notifications.length === 0) {
				throw new AppError({ message: "No notifications", status: 400 });
			}

			const result = await this.notificationService.testAllNotifications(notifications);

			if (!result) {
				throw new AppError({ message: "Failed to send all notifications", status: 500 });
			}

			return res.status(200).json({
				success: true,
				msg: "All notifications sent successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default NotificationController;
