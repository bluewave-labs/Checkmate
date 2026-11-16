import type { ErrorDefinition } from "@/utils/AppError.js";

export const teamErrors = {
	notFound: { status: 404, description: "Team not found" },
} satisfies Record<string, ErrorDefinition>;
