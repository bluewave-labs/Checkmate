import { NotificationChannels, NtfyAuthTypes } from "@/domain/notifications/notification.type.js";
import { z } from "zod";

export const notificationSchema = z
	.object({
		id: z.string(),
		userId: z.string(),
		teamId: z.string(),
		type: z.enum(NotificationChannels),
		notificationName: z.string(),
		address: z.string().optional(),
		phone: z.string().optional(),
		homeserverUrl: z.string().optional(),
		roomId: z.string().optional(),
		accessToken: z.string().optional(),
		accountSid: z.string().optional(),
		twilioPhoneNumber: z.string().optional(),
		topic: z.string().optional(),
		ntfyAuthType: z.enum(NtfyAuthTypes).optional(),
		ntfyUsername: z.string().optional(),
		customTitle: z.string().max(200).optional(),
		customBody: z.string().max(1000).optional(),
		pingContent: z.string().max(500).optional(),
		showMonitorUrl: z.boolean().optional(),
		showDetails: z.boolean().optional(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "Notification" });
