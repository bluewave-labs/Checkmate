import type { ErrorDefinition } from "@/utils/AppError.js";

export const ssoErrors = {
	sessionInvalid: { status: 401, description: "Your single sign-on session has ended. Sign in again." }, // refresh is a login, the only case defineRoutes.ts allows a service-level 401
} satisfies Record<string, ErrorDefinition>;
