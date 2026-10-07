import type { ErrorDefinition } from "@/utils/AppError.js";

export const emailErrors = {
	notConfigured: { status: 400, description: "Email is not configured" },
	sendFailed: { status: 502, description: "The mail server rejected the message" },
} satisfies Record<string, ErrorDefinition>;
