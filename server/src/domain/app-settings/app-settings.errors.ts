import type { ErrorDefinition } from "@/utils/AppError.js";

export const appSettingsErrors = {
	proxyNotFound: { status: 422, description: "Referenced proxy does not exist" },
	notificationNotFound: { status: 422, description: "Referenced notification does not exist" },
} satisfies Record<string, ErrorDefinition>;
