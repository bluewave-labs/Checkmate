import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";

import {
	createNotificationBodyValidation,
	deleteNotificationParamValidation,
	editNotificationBodyValidation,
	getNotificationByIdParamValidation,
	testNotificationBodyValidation,
	editNotificationParamValidation,
	testAllNotificationsBodyValidation,
	testSavedNotificationBodyValidation,
	testSavedNotificationParamValidation,
} from "@/api/validation/notificationValidation.js";
import { AppError } from "@/utils/AppError.js";
import { INotificationsService } from "@/domain/notifications/notification.service.js";
import type { Notification, PublicNotification } from "@/domain/notifications/notification.type.js";
import { requireTeamId, requireUserId } from "./controllerUtils.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";

const SERVICE_NAME = "NotificationController";

export interface INotificationController {
	testNotification: RequestHandler;
	testSavedNotification: RequestHandler;
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

	// Builds the client-facing shape of a notification. Credentials are never part of it: each one
	// is reported as a boolean saying whether a value is stored, the same way settingsController
	// reports pagespeedKeySet and emailPasswordSet.
	toPublicNotification = (notification: Notification): PublicNotification => ({
		id: notification.id,
		userId: notification.userId,
		teamId: notification.teamId,
		type: notification.type,
		notificationName: notification.notificationName,
		address: notification.address,
		phone: notification.phone,
		homeserverUrl: notification.homeserverUrl,
		roomId: notification.roomId,
		accountSid: notification.accountSid,
		twilioPhoneNumber: notification.twilioPhoneNumber,
		topic: notification.topic,
		createdAt: notification.createdAt,
		updatedAt: notification.updatedAt,
		accessTokenSet: Boolean(notification.accessToken),
	});

	testNotification = catchAsync(async (req: Request, res: Response) => {
		const notification = testNotificationBodyValidation.parse(req.body);
		const success = await this.notificationsService.sendTestNotification(notification);

		return res.status(200).json({
			success,
			msg: success ? "Notification sent successfully" : "Notification could not be sent — check the destination details.",
			details: { service: SERVICE_NAME },
		});
	});

	testSavedNotification = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const validatedParams = testSavedNotificationParamValidation.parse(req.params);
		const validatedBody = testSavedNotificationBodyValidation.parse(req.body);

		const success = await this.notificationsService.sendTestNotificationById(validatedParams.id, teamId, validatedBody);

		return res.status(200).json({
			success,
			msg: success ? "Notification sent successfully" : "Notification could not be sent — check the destination details.",
			details: { service: SERVICE_NAME },
		});
	});

	createNotification = catchAsync(async (req: Request, res: Response) => {
		const validatedBody = createNotificationBodyValidation.parse(req.body);

		const teamId = requireTeamId(req.user?.teamId);
		const userId = requireUserId(req.user?.id);

		const notification = await this.notificationsService.createNotification(validatedBody, userId, teamId);
		return res.status(200).json({
			success: true,
			msg: "Notification created successfully",
			data: this.toPublicNotification(notification),
		});
	});

	getNotificationsByTeamId = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const notifications = await this.notificationsService.findNotificationsByTeamId(teamId);

		return res.status(200).json({
			success: true,
			msg: "Notifications fetched successfully",
			data: notifications.map(this.toPublicNotification),
		});
	});

	deleteNotification = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const validatedParams = deleteNotificationParamValidation.parse(req.params);

		await this.notificationsService.deleteById(validatedParams.id, teamId);
		return res.status(200).json({
			success: true,
			msg: "Notification deleted successfully",
		});
	});

	getNotificationById = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const validatedParams = getNotificationByIdParamValidation.parse(req.params);

		const notification = await this.notificationsService.findById(validatedParams.id, teamId);

		return res.status(200).json({
			success: true,
			msg: "Notification fetched successfully",
			data: this.toPublicNotification(notification),
		});
	});

	editNotification = catchAsync(async (req: Request, res: Response) => {
		// Credentials are not returned, so the client cannot send back the ones it never received.
		// The edit schema lets them be omitted, which leaves the stored value untouched.
		const validatedBody = editNotificationBodyValidation.parse(req.body);
		const validatedParams = editNotificationParamValidation.parse(req.params);

		const teamId = requireTeamId(req.user?.teamId);
		const notificationId = validatedParams.id;

		const editedNotification = await this.notificationsService.updateById(notificationId, teamId, validatedBody);
		return res.status(200).json({
			success: true,
			msg: "Notification updated successfully",
			data: this.toPublicNotification(editedNotification),
		});
	});

	testAllNotifications = catchAsync(async (req: Request, res: Response) => {
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
	});
}

export default NotificationController;
