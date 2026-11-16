import type { ErrorDefinition } from "@/utils/AppError.js";

export const heartbeatErrors = {
	notFound: { status: 404, description: "No heartbeat monitor for this key and slug" },
} satisfies Record<string, ErrorDefinition>;
