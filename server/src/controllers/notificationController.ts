import { Request, Response, NextFunction } from "express";

import {
	createNotificationBodyValidation,
	deleteNotificationParamValidation,
	getNotificationByIdParamValidation,
	testNotificationBodyValidation,
	editNotificationParamValidation,
	testAllNotificationsBodyValidation,
} from "@/validation/notificationValidation.js";
import { AppError } from "@/utils/AppError.js";
import { INotificationsService } from "@/service/index.js";
import { requireTeamId, requireUserId } from "./controllerUtils.js";
import { IMonitorsRepository } from "@/repositories/index.js";

const SERVICE_NAME = "NotificationController";

class NotificationController {
	private notificationsService: INotificationsService;
	private monitorsRepository: IMonitorsRepository;
	constructor(notificationsService: INotificationsService, monitorsRepository: IMonitorsRepository) {
		this.notificationsService = notificationsService;
		this.monitorsRepository = monitorsRepository;
	}

	testNotification = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notification = testNotificationBodyValidation.parse(req.body);
			const success = await this.notificationsService.sendTestNotification(notification);

			if (!success) {
				throw new AppError({ message: "Sending notification failed", status: 500 });
			}

			return res.status(200).json({
				success: true,
				msg: "Notification sent successfully",
				details: { service: SERVICE_NAME },
			});
		} catch (error) {
			next(error);
		}
	};

	createNotification = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedBody = createNotificationBodyValidation.parse(req.body);

			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);

			const notification = await this.notificationsService.createNotification(validatedBody, userId, teamId);
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
			const teamId = requireTeamId(req.user?.teamId);
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
			const teamId = requireTeamId(req.user?.teamId);
			const validatedParams = deleteNotificationParamValidation.parse(req.params);

			await this.notificationsService.deleteById(validatedParams.id, teamId);
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
			const validatedParams = getNotificationByIdParamValidation.parse(req.params);

			const notification = await this.notificationsService.findById(validatedParams.id, teamId);

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
			const validatedBody = createNotificationBodyValidation.parse(req.body);
			const validatedParams = editNotificationParamValidation.parse(req.params);

			const teamId = requireTeamId(req.user?.teamId);
			const notificationId = validatedParams.id;

			const editedNotification = await this.notificationsService.updateById(notificationId, teamId, validatedBody);
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
			const validatedBody = testAllNotificationsBodyValidation.parse(req.body);

			const teamId = requireTeamId(req.user?.teamId);

			const monitor = await this.monitorsRepository.findById(validatedBody.monitorId, teamId);
			const notifications = monitor.notifications || [];

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
