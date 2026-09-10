import { z } from "zod";
import { passwordPattern, nameValidation, lowercaseEmailValidation } from "./shared.js";
import { UserRoles } from "@/domain/users/user.type.js";
import { MIN_INVITE_EXPIRY_HOURS, MAX_INVITE_EXPIRY_HOURS } from "@/domain/invites/invite.constants.js";

//****************************************
// Auth Validations
//****************************************

export const loginValidation = z.object({
	email: z.email("Must be a valid email address").transform((val) => val.toLowerCase()),
	password: z.string().min(1, "Password is required"),
});

export const registrationBodyValidation = z.object({
	firstName: nameValidation,
	lastName: nameValidation,
	email: lowercaseEmailValidation,
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(passwordPattern, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"),
	profileImage: z.any().optional(),
	inviteToken: z.string().optional().default(""),
});

export const recoveryValidation = z.object({
	email: z.email("Must be a valid email address"),
});

export const recoveryTokenBodyValidation = z.object({
	recoveryToken: z.string().min(1, "Recovery token is required"),
});

export const newPasswordValidation = z.object({
	recoveryToken: z.string().min(1, "Recovery token is required"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(passwordPattern, "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"),
	confirm: z.string().optional(),
});

// Shared by invite creation (optional — falls back to DEFAULT_INVITE_EXPIRY_HOURS) and
// the "change duration" update (required), so the bounds only live in one place.
const expiresInHoursValidation = z
	.number()
	.int("Expiry duration must be a whole number of hours")
	.min(MIN_INVITE_EXPIRY_HOURS, `Expiry duration must be at least ${MIN_INVITE_EXPIRY_HOURS} hour`)
	.max(MAX_INVITE_EXPIRY_HOURS, `Expiry duration must be at most ${MAX_INVITE_EXPIRY_HOURS} hours`);

export const inviteBodyValidation = z.object({
	email: z.email("Must be a valid email address"),
	role: z.array(z.enum(UserRoles)).min(1, "At least one role is required"),
	teamId: z.string().min(1, "Team ID is required"),
	expiresInHours: expiresInHoursValidation.optional(),
});

export const inviteVerificationBodyValidation = z.object({
	token: z.string().min(1, "Token is required"),
});

export const inviteIdParamValidation = z.object({
	id: z.string().min(1, "Invite ID is required"),
});

export const updateInviteExpiryBodyValidation = z.object({
	expiresInHours: expiresInHoursValidation,
});
