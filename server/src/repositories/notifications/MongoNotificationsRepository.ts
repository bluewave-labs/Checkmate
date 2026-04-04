import mongoose from "mongoose";
import { NotificationModel, type NotificationDocument } from "@/db/models/index.js";
import { INotificationsRepository } from "@/repositories/index.js";
import type { Notification } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";

class MongoNotificationsRepository implements INotificationsRepository {
	private mapDocuments = (documents: NotificationDocument[]): Notification[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};

	private toEntity = (doc: NotificationDocument): Notification => {
		const toStringId = (value: mongoose.Types.ObjectId | string): string => {
			return value instanceof mongoose.Types.ObjectId ? value.toString() : value;
		};

		const toDateString = (value: Date | string): string => {
			return value instanceof Date ? value.toISOString() : value;
		};

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
			username: doc.username ?? undefined,
			password: doc.password ?? undefined,
			accessToken: doc.accessToken ?? undefined,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (notificationData: Partial<Notification>) => {
		const notification = await NotificationModel.create({ ...notificationData });
		if (!notification) {
			throw new AppError({ message: "Failed to create notification", status: 500 });
		}
		return this.toEntity(notification);
	};

	findById = async (id: string, teamId: string): Promise<Notification> => {
		const notification = await NotificationModel.findOne({
			_id: new mongoose.Types.ObjectId(id),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		if (!notification) {
			throw new AppError({ message: "Notification not found", status: 404 });
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
			throw new AppError({ message: "Notification not found or could not be updated", status: 404 });
		}
		return this.toEntity(notification);
	};

	deleteById = async (id: string, teamId: string): Promise<Notification> => {
		const deleted = await NotificationModel.findOneAndDelete({
			_id: new mongoose.Types.ObjectId(id),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		if (!deleted) {
			throw new AppError({ message: "Notification not found or could not be deleted", status: 404 });
		}
		return this.toEntity(deleted);
	};
}

export default MongoNotificationsRepository;
