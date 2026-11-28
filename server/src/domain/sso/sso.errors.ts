import type { ErrorDefinition } from "@/utils/AppError.js";

export const ssoErrors = {
	sessionInvalid: { status: 401, description: "Your single sign-on session has ended. Sign in again." }, // refresh is a login, the only case defineRoutes.ts allows a service-level 401
	disabled: { status: 409, description: "Single sign-on isn't available on this server" },
	invalidReturnOrigin: { status: 400, description: "The return address must be an http or https origin with no path" },
	stateInvalid: { status: 400, description: "This sign-in link has expired. Start again." },
	codeInvalid: { status: 400, description: "This sign-in link has expired. Start again." },
	superadminNotAllowed: { status: 403, description: "The superadmin account signs in with a password" },
	accountConflict: { status: 409, description: "An account with this email exists but can't be linked. Ask your administrator." },
	notSetUp: { status: 409, description: "Finish setting up Checkmate before using single sign-on" },
} satisfies Record<string, ErrorDefinition>;
