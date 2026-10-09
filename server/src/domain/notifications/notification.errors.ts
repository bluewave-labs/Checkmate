import type { ErrorDefinition } from "@/utils/AppError.js";

export const notificationErrors = {
	notFound: { status: 404, description: "Notification not found" },
	noneConfigured: { status: 400, description: "The monitor has no notifications" },
} satisfies Record<string, ErrorDefinition>;
