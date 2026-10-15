import type { ErrorDefinition } from "@/utils/AppError.js";

export const appSettingsErrors = {
	proxyNotFound: { status: 422, description: "Referenced proxy does not exist" },
	notificationNotFound: { status: 422, description: "Referenced notification does not exist" },
	notificationChannelNotSupported: { status: 422, description: "Notification channel cannot receive egress alerts" },
} satisfies Record<string, ErrorDefinition>;
