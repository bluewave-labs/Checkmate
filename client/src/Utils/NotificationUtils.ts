import type { NotificationFormData } from "@/Validation/notifications";

export const normalizeNtfy = (data: NotificationFormData): NotificationFormData => {
	if (data.type !== "ntfy") return data;
	const authType = data.authType ?? "none";
	const base = { ...data, authType };
	switch (authType) {
		case "none":
			return { ...base, username: "", password: "", accessToken: "" };
		case "basic":
			return { ...base, accessToken: "" };
		case "bearer":
			return { ...base, username: "", password: "" };
		default:
			return base;
	}
};
