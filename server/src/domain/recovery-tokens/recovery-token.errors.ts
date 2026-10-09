import type { ErrorDefinition } from "@/utils/AppError.js";

export const recoveryTokenErrors = {
	notFound: { status: 404, description: "Recovery token not found" },
} satisfies Record<string, ErrorDefinition>;
