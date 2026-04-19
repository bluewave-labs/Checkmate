import type { NotificationFormData } from "@/Validation/notifications";

export const dropStaleAuth = (data: NotificationFormData): NotificationFormData => {
	// Providers That Support Basic/Bearer Auth: Drop Stale Data
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
