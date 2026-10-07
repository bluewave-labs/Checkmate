import { IAuthController } from "@/api/controllers/authController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	authPayloadResponseSchema,
	superadminExistsResponseSchema,
	loginValidation,
	newPasswordValidation,
	recoveryTokenBodyValidation,
	recoveryValidation,
	registrationBodyValidation,
} from "@/api/validation/authValidation.js";
import {
	createUserBodyValidation,
	editUserBodyValidation,
	editUserByIdBodyValidation,
	editUserByIdParamValidation,
	editUserPasswordByIdBodyValidation,
	getUserByIdParamValidation,
	userListResponseSchema,
} from "@/api/validation/userValidation.js";
import { json, okJson } from "@/api/routes/openapiHelpers.js";
import { userExample, userResponseSchema } from "@/domain/users/user.schema.js";
import { userErrors } from "@/domain/users/user.errors.js";
import { inviteErrors } from "@/domain/invites/invite.errors.js";
import { recoveryTokenErrors } from "@/domain/recovery-tokens/recovery-token.errors.js";
import { emailErrors } from "@/service/email.errors.js";

export const authRoutes: RouteTable<IAuthController> = {
	prefix: "/auth",
	tag: "auth",
	auth: "jwt",
	routes: [
		{
			method: "post",
			path: "/register",
			handler: "registerUser",
			summary: "Register a new user (first user becomes superadmin)",
			errors: [userErrors.firstUserEmailRequired, inviteErrors.notFound],
			auth: "none",
			upload: "profileImage",
			body: registrationBodyValidation,
			response: authPayloadResponseSchema,
		},
		{
			method: "post",
			path: "/login",
			handler: "loginUser",
			summary: "Log in",
			errors: [userErrors.invalidCredentials, userErrors.notFound],
			auth: "none",
			body: loginValidation,
			response: authPayloadResponseSchema,
			spec: (d) => ({
				...d,
				request: { body: { content: json(loginValidation, { email: "ada@example.com", password: "S3cure!Passw0rd" }) } },
				responses: {
					...d.responses,
					"200": okJson(authPayloadResponseSchema, "OK", { user: userExample, token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
				},
			}),
		},
		{
			method: "post",
			path: "/recovery/request",
			handler: "requestRecovery",
			summary: "Request a password recovery email",
			errors: [userErrors.notFound, emailErrors.notConfigured, emailErrors.sendFailed],
			auth: "none",
			body: recoveryValidation,
			spec: (d) => ({ ...d, request: { body: { content: json(recoveryValidation, { email: "ada@example.com" }) } } }),
		},
		{
			method: "post",
			path: "/recovery/validate",
			handler: "validateRecovery",
			summary: "validate a password recovery token",
			errors: [recoveryTokenErrors.notFound],
			auth: "none",
			body: recoveryTokenBodyValidation,
		},
		{
			method: "post",
			path: "/recovery/reset",
			handler: "resetPassword",
			summary: "Reset password using a recovery token",
			errors: [userErrors.passwordUnchanged, recoveryTokenErrors.notFound, userErrors.notFound],
			auth: "none",
			body: newPasswordValidation,
			response: authPayloadResponseSchema,
		},
		{
			method: "get",
			path: "/users/superadmin",
			handler: "checkSuperadminExists",
			summary: "Check whether a superadmin user exists",
			auth: "none",
			response: superadminExistsResponseSchema,
		},

		{
			method: "get",
			path: "/users",
			handler: "getAllUsers",
			summary: "List all users (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: userListResponseSchema,
		},
		{
			method: "post",
			path: "/users",
			handler: "createUser",
			summary: "Create a new user (superadmin)",
			errors: [userErrors.roleAboveCaller],
			roles: ["superadmin"],
			upload: "profileImage",
			body: createUserBodyValidation,
			response: userResponseSchema,
			spec: (d) => {
				const { "200": _ok, ...errors } = d.responses;
				return { ...d, responses: { "201": okJson(userResponseSchema, "User created"), ...errors } };
			},
		},
		{
			method: "get",
			path: "/users/:userId",
			handler: "getUserById",
			summary: "Get a user by id (admin/superadmin)",
			roles: ["admin", "superadmin"],
			params: getUserByIdParamValidation,
			response: userResponseSchema,
			errors: [userErrors.notFound],
		},
		{
			method: "patch",
			path: "/users/:userId",
			handler: "editUserById",
			summary: "Edit a user (superadmin)",
			errors: [userErrors.notFound],
			roles: ["superadmin"],
			params: editUserByIdParamValidation,
			body: editUserByIdBodyValidation,
		},
		{
			method: "patch",
			path: "/users/:userId/password",
			handler: "editUserPasswordById",
			summary: "Change a user's password (superadmin)",
			errors: [userErrors.notFound],
			roles: ["superadmin"],
			params: editUserByIdParamValidation,
			body: editUserPasswordByIdBodyValidation,
		},
		{
			method: "delete",
			path: "/users/:userId",
			handler: "deleteUserById",
			summary: "Delete a user (admin/superadmin)",
			errors: [userErrors.cannotDeleteSelf, userErrors.demoUserProtected, userErrors.notOnTeam, userErrors.roleAboveCaller, userErrors.notFound],
			roles: ["admin", "superadmin"],
			params: getUserByIdParamValidation,
		},
		{
			method: "patch",
			path: "/user",
			handler: "editUser",
			summary: "Edit the currently authenticated user",
			errors: [userErrors.incorrectCurrentPassword, userErrors.notFound],
			roles: ["admin", "superadmin", "user"],
			upload: "profileImage",
			body: editUserBodyValidation,
			response: userResponseSchema,
		},
		{
			method: "delete",
			path: "/user",
			handler: "deleteUser",
			summary: "Delete the currently authenticated user",
			errors: [userErrors.demoUserProtected, userErrors.notFound],
			roles: ["admin", "superadmin", "user"],
		},
	],
};
