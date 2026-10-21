import type { ErrorDefinition } from "@/utils/AppError.js";

export const monitorStatsErrors = {
	notFound: { status: 404, description: "Monitor stats not found" },
} satisfies Record<string, ErrorDefinition>;
