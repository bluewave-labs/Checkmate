import { useMemo } from "react";
import { notificationSchema } from "@/Validation/notifications";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";

interface UseNotificationFormOptions {
	data?: Notification | null;
}

function buildDefaults(data: Notification | null): NotificationFormData {
	if (data?.type === "matrix") {
		return {
			type: "matrix",
			notificationName: data.notificationName || "",
			homeserverUrl: data.homeserverUrl || "",
			roomId: data.roomId || "",
			accessToken: data.accessToken || "",
		};
	}
	if (data?.type === "telegram") {
		return {
			type: "telegram",
			notificationName: data.notificationName || "",
			address: data.address || "",
			accessToken: data.accessToken || "",
		};
	}
	if (data?.type === "slack") {
		return {
			type: "slack",
			notificationName: data.notificationName || "",
			address: data.address || "",
		};
	}
	if (data?.type === "discord") {
		return {
			type: "discord",
			notificationName: data.notificationName || "",
			address: data.address || "",
		};
	}
	if (data?.type === "webhook") {
		return {
			type: "webhook",
			notificationName: data.notificationName || "",
			address: data.address || "",
		};
	}
	if (data?.type === "pager_duty") {
		return {
			type: "pager_duty",
			notificationName: data.notificationName || "",
			address: data.address || "",
		};
	}
	if (data?.type === "teams") {
		return {
			type: "teams",
			notificationName: data.notificationName || "",
			address: data.address || "",
		};
	}
	if (data?.type === "twilio") {
		return {
			type: "twilio",
			notificationName: data.notificationName || "",
			address: data.address || "",
			accessToken: data.accessToken || "",
			phone: data.phone || "",
			homeserverUrl: data.homeserverUrl || "",
		};
	}
	if (data?.type === "pushover") {
		return {
			type: "pushover",
			notificationName: data.notificationName || "",
			address: data.address || "",
			accessToken: data.accessToken || "",
		};
	}
	// Default: email (covers both data === null and data.type === "email")
	return {
		type: "email",
		notificationName: data?.notificationName || "",
		address: data?.address || "",
	};
}

export const useNotificationForm = ({ data = null }: UseNotificationFormOptions = {}) => {
	return useMemo(() => {
		const defaults = buildDefaults(data);
		return { schema: notificationSchema, defaults };
	}, [data]);
};
