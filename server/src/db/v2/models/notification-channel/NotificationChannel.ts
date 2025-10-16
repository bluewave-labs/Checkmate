import mongoose, { Schema, Document, Types } from "mongoose";
export const ChannelTypes = ["email", "slack", "discord", "webhook"] as const;
export type ChannelType = (typeof ChannelTypes)[number];

export interface INotificationChannelConfig {
	url?: string; // For webhook, slack, discord
	emailAddress?: string; // For email
}

export interface INotificationChannel {
	_id: Types.ObjectId;
	name: string;
	type: ChannelType;
	config: INotificationChannelConfig;
	isActive: boolean;
	createdBy: Types.ObjectId;
	updatedBy: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const NotificationChannelConfigSchema = new Schema<INotificationChannelConfig>(
	{
		url: { type: String, required: false },
		emailAddress: { type: String, required: false },
	},
	{ _id: false, strict: "throw" }
);

const NotificationChannelSchema = new Schema<INotificationChannel>(
	{
		name: { type: String, required: true, trim: true },
		type: {
			type: String,
			required: true,
			enum: ChannelTypes,
		},
		config: { type: NotificationChannelConfigSchema, required: true },
		isActive: { type: Boolean, required: true, default: true },
		createdBy: { type: Schema.Types.ObjectId, ref: "User_v2", required: true },
		updatedBy: { type: Schema.Types.ObjectId, ref: "User_v2", required: true },
	},
	{ timestamps: true }
);

NotificationChannelSchema.index({ isActive: 1 });
NotificationChannelSchema.index({ type: 1 });
NotificationChannelSchema.index({ type: 1, isActive: 1 });

export const NotificationChannel = mongoose.model<INotificationChannel>("NotificationChannel_v2", NotificationChannelSchema);
