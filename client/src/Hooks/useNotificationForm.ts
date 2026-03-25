import { useMemo } from "react";
import { notificationSchema } from "@/Validation/notifications";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";

interface UseNotificationFormOptions {
	data?: Notification | null;
}

// Flat defaults type compatible with all form variants for defaultValue props
type NotificationDefaults = {
	type: NotificationFormData["type"];
	notificationName: string;
	address?: string;
	homeserverUrl?: string;
	roomId?: string;
	accessToken?: string;
};

export const useNotificationForm = ({ data = null }: UseNotificationFormOptions = {}) => {
	return useMemo(() => {
		let defaults: NotificationDefaults = {
			type: (data?.type || "email") as NotificationFormData["type"],
			notificationName: data?.notificationName || "",
			address: data?.address || "",
		};

		if (data?.type === "matrix") {
			defaults = {
				type: "matrix",
				notificationName: data.notificationName || "",
				homeserverUrl: data.homeserverUrl || "",
				roomId: data.roomId || "",
				accessToken: data.accessToken || "",
			};
		} else if (data?.type === "telegram") {
			defaults = {
				type: "telegram",
				notificationName: data.notificationName || "",
				address: data.address || "",
				accessToken: data.accessToken || "",
			};
		}

		return { schema: notificationSchema, defaults: defaults as NotificationFormData };
	}, [data]);
};
