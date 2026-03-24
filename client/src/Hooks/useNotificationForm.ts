import { useMemo } from "react";
import { notificationSchema } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";

interface UseNotificationFormOptions {
	data?: Notification | null;
}

export const useNotificationForm = ({ data = null }: UseNotificationFormOptions = {}) => {
	return useMemo(() => {
		const defaults =
			data?.type === "matrix"
				? {
						type: "matrix" as const,
						notificationName: data.notificationName || "",
						homeserverUrl: data.homeserverUrl || "",
						roomId: data.roomId || "",
						accessToken: data.accessToken || "",
					}
				: data?.type === "telegram"
					? {
							type: "telegram" as const,
							notificationName: data.notificationName || "",
							address: data.address || "",
							accessToken: data.accessToken || "",
						}
					: {
							type: (data?.type || "email") as Exclude<Notification["type"], "matrix" | "telegram">,
							notificationName: data?.notificationName || "",
							address: data?.address || "",
						};

		return { schema: notificationSchema, defaults };
	}, [data]);
};
