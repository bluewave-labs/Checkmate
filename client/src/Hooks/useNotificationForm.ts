import { useMemo } from "react";
import { notificationSchema } from "@/Validation/notifications";
import type { NotificationFormData } from "@/Validation/notifications";
import type { Notification } from "@/Types/Notification";

interface UseNotificationFormOptions {
	data?: Notification | null;
}

function buildDefaults(data: Notification | null): NotificationFormData {
	// Every channel field defaults to "" (not undefined) so untouched required
	// fields fail zod with their custom messages instead of a type error.
	const base = {
		notificationName: data?.notificationName || "",
		address: "",
		accessToken: "",
		accountSid: "",
		phone: "",
		twilioPhoneNumber: "",
		homeserverUrl: "",
		roomId: "",
		topic: "",
	};
	if (data?.type === "matrix") {
		return {
			...base,
			type: "matrix",
			homeserverUrl: data.homeserverUrl || "",
			roomId: data.roomId || "",
			accessToken: data.accessToken || "",
		};
	}
	if (data?.type === "telegram") {
		return {
			...base,
			type: "telegram",
			address: data.address || "",
			accessToken: data.accessToken || "",
		};
	}
	if (data?.type === "slack") {
		return {
			...base,
			type: "slack",
			address: data.address || "",
		};
	}
	if (data?.type === "discord") {
		return {
			...base,
			type: "discord",
			address: data.address || "",
		};
	}
	if (data?.type === "webhook") {
		return {
			...base,
			type: "webhook",
			address: data.address || "",
		};
	}
	if (data?.type === "pager_duty") {
		return {
			...base,
			type: "pager_duty",
			address: data.address || "",
		};
	}
	if (data?.type === "teams") {
		return {
			...base,
			type: "teams",
			address: data.address || "",
		};
	}
	if (data?.type === "twilio") {
		return {
			...base,
			type: "twilio",
			accountSid: data.accountSid || "",
			accessToken: data.accessToken || "",
			phone: data.phone || "",
			twilioPhoneNumber: data.twilioPhoneNumber || "",
		};
	}
	if (data?.type === "pushover") {
		return {
			...base,
			type: "pushover",
			address: data.address || "",
			accessToken: data.accessToken || "",
		};
	}
	if (data?.type === "ntfy") {
		return {
			...base,
			type: "ntfy",
			address: data.address || "",
			topic: data.topic || "",
		};
	}
	// Default: email (covers both data === null and data.type === "email")
	return {
		...base,
		type: "email",
		address: data?.address || "",
	};
}

export const useNotificationForm = ({ data = null }: UseNotificationFormOptions = {}) => {
	return useMemo(() => {
		const defaults = buildDefaults(data);
		return { schema: notificationSchema, defaults };
	}, [data]);
};
