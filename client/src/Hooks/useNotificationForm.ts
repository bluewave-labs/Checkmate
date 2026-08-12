import { useMemo } from "react";
import { notificationSchema } from "@/Validation/notifications";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";

interface UseNotificationFormOptions {
	data?: Notification | null;
}

function buildDefaults(data: Notification | null): NotificationFormData {
	return {
		type: data?.type ?? "email",
		notificationName: data?.notificationName || "",
		address: data?.address || "",
		accessToken: data?.accessToken || "",
		accountSid: data?.accountSid || "",
		phone: data?.phone || "",
		twilioPhoneNumber: data?.twilioPhoneNumber || "",
		homeserverUrl: data?.homeserverUrl || "",
		roomId: data?.roomId || "",
		topic: data?.topic || "",
	};
}

export const useNotificationForm = ({ data = null }: UseNotificationFormOptions = {}) => {
	return useMemo(() => {
		const defaults = buildDefaults(data);
		return { schema: notificationSchema, defaults };
	}, [data]);
};
