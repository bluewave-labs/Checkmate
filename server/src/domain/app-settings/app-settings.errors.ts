import type { ErrorDefinition } from "@/utils/AppError.js";

export const appSettingsErrors = {
	proxyNotFound: { status: 422, description: "Referenced proxy does not exist" },
} satisfies Record<string, ErrorDefinition>;
