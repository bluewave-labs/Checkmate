import { RequestHandler } from "express";

import {
	createNotificationBodyValidation,
	deleteNotificationParamValidation,
	getNotificationByIdParamValidation,
	testNotificationBodyValidation,
	editNotificationParamValidation,
	testAllNotificationsBodyValidation,
} from "@/api/validation/notificationValidation.js";
import { AppError } from "@/utils/AppError.js";
import { INotificationsService } from "@/domain/notifications/notification.service.js";
import { Handler, requireTeamId, requireUserId } from "./controllerUtils.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";

export interface INotificationController {
	testNotification: RequestHandler;
	createNotification: RequestHandler;
	getNotificationsByTeamId: RequestHandler;
	deleteNotification: RequestHandler;
	getNotificationById: RequestHandler;
	editNotification: RequestHandler;
	testAllNotifications: RequestHandler;
}
class NotificationController implements INotificationController {
	private notificationsService: INotificationsService;
	private monitorsRepository: IMonitorsRepository;
	constructor(notificationsService: INotificationsService, monitorsRepository: IMonitorsRepository) {
		this.notificationsService = notificationsService;
		this.monitorsRepository = monitorsRepository;
	}

	testNotification: Handler = async (req, res) => {
		const notification = testNotificationBodyValidation.parse(req.body);
		let success = false;
		let reason: string | undefined;
		try {
			success = await this.notificationsService.sendTestNotification(notification);
		} catch (error: unknown) {
			if (!(error instanceof AppError)) throw error;
			reason = error.message;
		}
		const msg = success ? "Notification sent successfully" : (reason ?? "Notification could not be sent — check the destination details.");
		res.json({ success, msg });
	};

	createNotification: Handler = async (req, res) => {
		const validatedBody = createNotificationBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);
		const userId = requireUserId(req.user?.id);
		const data = await this.notificationsService.createNotification(validatedBody, userId, teamId);
		res.json({ success: true, msg: "Notification created successfully", data });
	};

	getNotificationsByTeamId: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.notificationsService.findNotificationsByTeamId(teamId);

		res.json({ success: true, msg: "Notifications fetched successfully", data });
	};

	deleteNotification: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id } = deleteNotificationParamValidation.parse(req.params);

		await this.notificationsService.deleteById(id, teamId);
		res.json({ success: true, msg: "Notification deleted successfully" });
	};

	getNotificationById: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id } = getNotificationByIdParamValidation.parse(req.params);
		const data = await this.notificationsService.findById(id, teamId);
		res.json({ success: true, msg: "Notification fetched successfully", data });
	};

	editNotification: Handler = async (req, res) => {
		const validatedBody = createNotificationBodyValidation.parse(req.body);
		const { id } = editNotificationParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.notificationsService.updateById(id, teamId, validatedBody);
		res.json({ success: true, msg: "Notification updated successfully", data });
	};

	testAllNotifications: Handler = async (req, res) => {
		const { monitorId } = testAllNotificationsBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		const notifications = monitor.notifications || [];
		if (notifications.length === 0) {
			throw new AppError({ message: "No notifications", status: 400 });
		}
		const result = await this.notificationsService.testAllNotifications(notifications);
		if (!result) {
			throw new AppError({ message: "Failed to send all notifications", status: 500 });
		}
		res.json({ success: true, msg: "All notifications sent successfully" });
	};
}

export default NotificationController;
