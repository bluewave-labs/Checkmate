import mongoose from "mongoose";
import { NotificationModel, type NotificationDocument } from "@/db/models/index.js";
import { INotificationsRepository } from "@/repositories/index.js";
import type { Notification } from "@/types/index.js";

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
			accessToken: doc.accessToken ?? undefined,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	findNotificationsByIds = async (ids: string[]) => {
		const mongoIds = ids.map((id) => new mongoose.Types.ObjectId(id));
		const documents = await NotificationModel.find({ _id: { $in: mongoIds } });
		return this.mapDocuments(documents);
	};
}

export default MongoNotificationsRepository;
