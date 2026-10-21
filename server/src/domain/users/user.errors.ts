import type { ErrorDefinition } from "@/utils/AppError.js";

export const userErrors = {
	notFound: { status: 404, description: "User not found" },
	firstUserEmailRequired: { status: 400, description: "Email is required for the first user" },
	invalidCredentials: { status: 401, description: "Invalid credentials" },
	incorrectCurrentPassword: { status: 403, description: "Incorrect current password" },
	passwordUnchanged: { status: 400, description: "New password cannot be the same as the old one" },
	demoUserProtected: { status: 400, description: "Demo user cannot be deleted" },
	cannotDeleteSelf: { status: 400, description: "Cannot delete your own account from here" },
	notOnTeam: { status: 403, description: "The user is not on the caller's team" },
	roleAboveCaller: { status: 403, description: "The target role is above the caller's" },
} satisfies Record<string, ErrorDefinition>;
