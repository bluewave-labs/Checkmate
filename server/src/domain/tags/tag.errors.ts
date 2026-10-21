import type { ErrorDefinition } from "@/utils/AppError.js";

export const tagErrors = {
	notFound: { status: 404, description: "Tag not found" },
	nameTaken: { status: 409, description: "A tag with that name already exists" },
} satisfies Record<string, ErrorDefinition>;
