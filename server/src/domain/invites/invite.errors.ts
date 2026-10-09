import type { ErrorDefinition } from "@/utils/AppError.js";

export const inviteErrors = {
	notFound: { status: 404, description: "Invite not found" },
	emailRequired: { status: 400, description: "Invite email is required" },
	roleAboveCaller: { status: 403, description: "The invited role is above the caller's" },
} satisfies Record<string, ErrorDefinition>;
