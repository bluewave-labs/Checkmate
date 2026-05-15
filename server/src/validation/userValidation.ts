import { z } from "zod";
import { UserRoles } from "@/types/user.js";
import { nameValidation, lowercaseEmailValidation, passwordPattern } from "./shared.js";

//****************************************
// User Validations
//****************************************

export const getUserByIdParamValidation = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export const editUserByIdParamValidation = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export const editUserByIdBodyValidation = z.object({
	firstName: nameValidation,
	lastName: nameValidation,
	role: z.array(z.enum(UserRoles)).min(1, "At least one role is required"),
});

export const editSuperadminUserByIdBodyValidation = z.object({
	firstName: nameValidation,
	lastName: nameValidation,
	role: z.array(z.enum(UserRoles)).min(1, "At least one role is required"),
});

export const editUserPasswordByIdBodyValidation = z.object({
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(passwordPattern, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"),
});

export const createUserBodyValidation = z.object({
	firstName: nameValidation,
	lastName: nameValidation,
	email: lowercaseEmailValidation,
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(passwordPattern, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"),
	role: z.array(z.enum(UserRoles)).min(1, "At least one role is required"),
});

export const editUserBodyValidation = z.object({
	firstName: nameValidation.optional(),
	lastName: nameValidation.optional(),
	email: lowercaseEmailValidation.optional(),
	profilePicture: z.string().optional(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(passwordPattern, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character")
		.optional(),
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(passwordPattern, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character")
		.optional(),
});

// Canonical user shape returned by auth/user endpoints. Keep aligned with what
// the controllers actually serialize (password is intentionally omitted).
export const userResponseSchema = z
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
	.passthrough();
