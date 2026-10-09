import mongoose from "mongoose";
import { NotificationModel, type NotificationDocument } from "@/domain/notifications/notification.model.js";
import { INotificationsRepository } from "@/domain/notifications/notification.repository.interface.js";
import type { Notification } from "@/domain/notifications/notification.type.js";
import { AppError, internalError } from "@/utils/AppError.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
import { notificationErrors } from "@/domain/notifications/notification.errors.js";
const SERVICE_NAME = "NotificationsRepository";
class MongoNotificationsRepository implements INotificationsRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private mapDocuments = (documents: NotificationDocument[]): Notification[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};

	private toEntity = (doc: NotificationDocument): Notification => {
		return {
			id: toStringId(doc._id),
			userId: toStringId(doc.userId),
			teamId: toStringId(doc.teamId),
			type: doc.type,
			notificationName: doc.notificationName,
			address: doc.address ?? undefined,
			phone: doc.phone ?? undefined,
			homeserverUrl: doc.homeserverUrl ?? undefined,
			roomId: doc.roomId ?? undefined,
			accessToken: doc.accessToken ?? undefined,
			accountSid: doc.accountSid ?? undefined,
			twilioPhoneNumber: doc.twilioPhoneNumber ?? undefined,
			topic: doc.topic ?? undefined,
			ntfyAuthType: doc.ntfyAuthType ?? undefined,
			ntfyUsername: doc.ntfyUsername ?? undefined,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (notificationData: Partial<Notification>) => {
		const notification = await NotificationModel.create({ ...notificationData });
		if (!notification) {
			throw new AppError(internalError, { message: "Failed to create notification", service: SERVICE_NAME, method: "create" });
		}
		return this.toEntity(notification);
	};

	findById = async (id: string, teamId: string): Promise<Notification> => {
		const notification = await NotificationModel.findOne({
			_id: new mongoose.Types.ObjectId(id),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		if (!notification) {
			throw new AppError(notificationErrors.notFound, { service: SERVICE_NAME, method: "findById" });
		}
		return this.toEntity(notification);
	};

	findNotificationsByIds = async (ids: string[]) => {
		const mongoIds = ids.map((id) => new mongoose.Types.ObjectId(id));
		const documents = await NotificationModel.find({ _id: { $in: mongoIds } });
		return this.mapDocuments(documents);
	};

	findByTeamId = async (teamId: string): Promise<Notification[]> => {
		const documents = await NotificationModel.find({ teamId });
		return this.mapDocuments(documents);
	};

	updateById = async (id: string, teamId: string, patch: Partial<Notification>): Promise<Notification> => {
		const notification = await NotificationModel.findOneAndUpdate(
			{
				_id: new mongoose.Types.ObjectId(id),
				teamId: new mongoose.Types.ObjectId(teamId),
			},
			{ $set: patch },
			{ new: true, runValidators: true }
		);
		if (!notification) {
			throw new AppError(notificationErrors.notFound, { service: SERVICE_NAME, method: "updateById" });
		}
		return this.toEntity(notification);
	};

	deleteById = async (id: string, teamId: string): Promise<Notification> => {
		const deleted = await NotificationModel.findOneAndDelete({
			_id: new mongoose.Types.ObjectId(id),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		if (!deleted) {
			throw new AppError(notificationErrors.notFound, {
				message: "Notification not found or could not be deleted",
				service: SERVICE_NAME,
				method: "deleteById",
			});
		}
		return this.toEntity(deleted);
	};
}

export default MongoNotificationsRepository;
