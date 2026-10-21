import type { ErrorDefinition } from "@/utils/AppError.js";

export const middlewareErrors = {
	invalidRequest: { status: 400, description: "Invalid request" },
	unauthenticated: { status: 401, description: "Unauthorized" },
	forbidden: { status: 403, description: "Forbidden" },
	fileTooLarge: { status: 413, description: "File too large" },
	unsupportedFileType: { status: 415, description: "Unsupported file type" },
	tooManyRequests: { status: 429, description: "Too many requests" },
} satisfies Record<string, ErrorDefinition>;
