import type { ErrorDefinition } from "@/utils/AppError.js";

export const connectErrors = {
	hostNotAllowed: { status: 400, description: "Connect host not allowed" },
	stateUnavailable: { status: 503, description: "Connect state is not available. If this continues, check ENCRYPTION_KEY and the server logs" },
	encryptionKeyMissing: { status: 422, description: "Checkmate Connect needs ENCRYPTION_KEY set on the server" },
} satisfies Record<string, ErrorDefinition>;
