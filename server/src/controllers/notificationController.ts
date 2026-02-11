import { Request, Response, NextFunction } from "express";

import { Notification } from "@/types/index.js";
import { createNotificationBodyValidation } from "@/validation/joi.js";
import { AppError } from "@/utils/AppError.js";
import { IMonitorsRepository } from "@/repositories/index.js";
import { INotificationsService } from "@/service/index.js";
import { requireTeamId } from "./controllerUtils.js";

const SERVICE_NAME = "NotificationController";

class NotificationController {
	static SERVICE_NAME = SERVICE_NAME;
	private notificationsService: INotificationsService;
	private monitorsRepository: IMonitorsRepository;
	constructor(notificationsService: INotificationsService, monitorsRepository: IMonitorsRepository) {
		this.notificationsService = notificationsService;
		this.monitorsRepository = monitorsRepository;
	}

	get serviceName() {
		return NotificationController.SERVICE_NAME;
	}

	testNotification = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notification: Notification = req.body;
			const success = await this.notificationsService.sendTestNotification(notification);

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

			const userId = req?.user?.id;
			if (!userId) {
				throw new AppError({ message: "User ID is required", status: 400 });
			}
			body.userId = userId;
			body.teamId = teamId;

			const notification = await this.notificationsService.createNotification(body);
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

			const notifications = await this.notificationsService.findNotificationsByTeamId(teamId);

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

			const notificationId = req.params.id as string;
			if (!notificationId) {
				throw new AppError({ message: "Notification ID is required", status: 400 });
			}

			await this.notificationsService.deleteById(notificationId, teamId);
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
			const teamId = requireTeamId(req.user?.teamId);
			const notificationId = req.params.id as string;
			if (!notificationId) {
				throw new AppError({ message: "Notification ID is required", status: 400 });
			}

			const notification = await this.notificationsService.findById(notificationId, teamId);

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

			const teamId = requireTeamId(req.user?.teamId);
			const notificationId = req.params.id as string;
			if (!notificationId) {
				throw new AppError({ message: "Notification ID is required", status: 400 });
			}
			const editedNotification = await this.notificationsService.updateById(notificationId, teamId, req.body);
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

			const result = await this.notificationsService.testAllNotifications(notifications);

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
