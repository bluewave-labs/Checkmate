import { useMemo } from "react";
import { notificationSchema } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";

interface UseNotificationFormOptions {
	data?: Notification | null;
}

type NotificationDefaults = {
	type: Notification["type"];
	notificationName: string;
	address?: string;
	homeserverUrl?: string;
	roomId?: string;
	accessToken?: string;
};

export const useNotificationForm = ({ data = null }: UseNotificationFormOptions = {}) => {
	return useMemo(() => {
		let defaults: NotificationDefaults = {
			type: (data?.type || "email") as Notification["type"],
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

		return { schema: notificationSchema, defaults };
	}, [data]);
};
