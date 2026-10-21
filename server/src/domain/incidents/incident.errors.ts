import type { ErrorDefinition } from "@/utils/AppError.js";

export const incidentErrors = {
	notFound: { status: 404, description: "Incident not found" },
	alreadyResolved: { status: 409, description: "Incident is already resolved" },
} as const satisfies Record<string, ErrorDefinition>;
