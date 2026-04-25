import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, json, multipart, okJson, okJsonNoData, standardErrors } from "../helpers.js";
import {
	loginValidation,
	registrationBodyValidation,
	recoveryValidation,
	recoveryTokenBodyValidation,
	newPasswordValidation,
} from "@/validation/authValidation.js";
import {
	getUserByIdParamValidation,
	editUserByIdParamValidation,
	editUserByIdBodyValidation,
	editUserPasswordByIdBodyValidation,
	createUserBodyValidation,
	editUserBodyValidation,
} from "@/validation/userValidation.js";

const tags = ["auth"];

const userObject = z
	.object({
		_id: z.string(),
		firstName: z.string(),
		lastName: z.string(),
		email: z.string(),
		role: z.array(z.string()),
		teamId: z.string().optional(),
		profileImage: z.string().nullable().optional(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.passthrough()
	.openapi("User");

const authPayload = z.object({ user: userObject, token: z.string().optional() }).openapi("AuthPayload");

registry.registerPath({
	method: "post",
	path: "/auth/register",
	tags,
	summary: "Register a new user (first user becomes superadmin)",
	request: { body: { content: multipart(registrationBodyValidation.shape, "profileImage") } },
	responses: { "200": okJson(authPayload), ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/auth/login",
	tags,
	summary: "Log in",
	request: { body: { content: json(loginValidation) } },
	responses: {
		"200": okJson(authPayload),
		"401": { description: "Invalid credentials", content: json(z.object({ success: z.literal(false), msg: z.string() })) },
		"500": standardErrors["500"],
	},
});

registry.registerPath({
	method: "post",
	path: "/auth/recovery/request",
	tags,
	summary: "Request a password recovery email",
	request: { body: { content: json(recoveryValidation) } },
	responses: { "200": okJsonNoData(), "500": standardErrors["500"] },
});

registry.registerPath({
	method: "post",
	path: "/auth/recovery/validate",
	tags,
	summary: "Validate a password recovery token",
	request: { body: { content: json(recoveryTokenBodyValidation) } },
	responses: { "200": okJsonNoData(), "500": standardErrors["500"] },
});

registry.registerPath({
	method: "post",
	path: "/auth/recovery/reset",
	tags,
	summary: "Reset password using a recovery token",
	request: { body: { content: json(newPasswordValidation) } },
	responses: { "200": okJsonNoData(), "500": standardErrors["500"] },
});

registry.registerPath({
	method: "get",
	path: "/auth/users/superadmin",
	tags,
	summary: "Check whether a superadmin user exists",
	responses: { "200": okJson(z.object({ superAdminExists: z.boolean() })), "500": standardErrors["500"] },
});

registry.registerPath({
	method: "get",
	path: "/auth/users",
	tags,
	summary: "List all users (admin/superadmin)",
	security: bearer,
	responses: { "200": okJson(z.array(userObject)), ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/auth/users",
	tags,
	summary: "Create a new user (superadmin)",
	security: bearer,
	request: { body: { content: multipart(createUserBodyValidation.shape, "profileImage") } },
	responses: { "201": okJson(userObject, "User created"), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/auth/users/{userId}",
	tags,
	summary: "Get a user by id",
	security: bearer,
	request: { params: getUserByIdParamValidation },
	responses: {
		"200": okJson(userObject),
		"404": { description: "User not found", content: json(z.object({ success: z.literal(false), msg: z.string() })) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "patch",
	path: "/auth/users/{userId}",
	tags,
	summary: "Edit a user (superadmin)",
	security: bearer,
	request: {
		params: editUserByIdParamValidation,
		body: { content: json(editUserByIdBodyValidation) },
	},
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/auth/users/{userId}/password",
	tags,
	summary: "Change a user's password (superadmin)",
	security: bearer,
	request: {
		params: editUserByIdParamValidation,
		body: { content: json(editUserPasswordByIdBodyValidation) },
	},
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/auth/users/{userId}",
	tags,
	summary: "Delete a user (admin/superadmin)",
	security: bearer,
	request: { params: getUserByIdParamValidation },
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/auth/user",
	tags,
	summary: "Edit the currently authenticated user",
	security: bearer,
	request: { body: { content: multipart(editUserBodyValidation.shape, "profileImage") } },
	responses: { "200": okJson(userObject), ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/auth/user",
	tags,
	summary: "Delete the currently authenticated user",
	security: bearer,
	responses: { "200": okJsonNoData(), ...standardErrors },
});
