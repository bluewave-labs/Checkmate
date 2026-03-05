import { Schema, model, type Types } from "mongoose";
import type { Notification, NotificationChannel } from "@/types/notification.js";

interface NotificationDocument extends Omit<Notification, "id" | "userId" | "teamId" | "createdAt" | "updatedAt"> {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			immutable: true,
			required: true,
		},
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
			required: true,
		},
		type: {
			type: String,
			enum: ["email", "slack", "discord", "webhook", "pager_duty", "matrix", "teams"] as NotificationChannel[],
			required: true,
		},
		notificationName: {
			type: String,
			required: true,
		},
		address: { type: String },
		phone: { type: String },
		homeserverUrl: { type: String },
		roomId: { type: String },
		accessToken: { type: String },
	},
	{
		timestamps: true,
	}
);

const NotificationModel = model<NotificationDocument>("Notification", NotificationSchema);

export type { NotificationDocument };
export { NotificationModel };
export default NotificationModel;
