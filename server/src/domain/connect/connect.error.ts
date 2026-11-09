import type { ErrorDefinition } from "@/utils/AppError.js";

export const connectErrors = {
	hostNotAllowed: { status: 400, description: "Connect host not allowed" },
	stateUnavailable: { status: 503, description: "Connect state is not available. If this continues, check ENCRYPTION_KEY and the server logs" },
} satisfies Record<string, ErrorDefinition>;
