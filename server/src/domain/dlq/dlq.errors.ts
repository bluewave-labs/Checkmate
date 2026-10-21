import type { ErrorDefinition } from "@/utils/AppError.js";

export const dlqErrors = {
	notFound: { status: 404, description: "Dead-letter item not found" },
} satisfies Record<string, ErrorDefinition>;
