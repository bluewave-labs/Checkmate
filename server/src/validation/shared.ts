import { z } from "zod";
import { type UserRole } from "@/types/user.js";

/**
 * Password pattern: requires at least one lowercase, uppercase, number, and special character
 */
export const passwordPattern =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!?@#$%^&*()\-_=+[\]{};:'",.~`|\\/])[A-Za-z0-9!?@#$%^&*()\-_=+[\]{};:'",.~`|\\/]+$/;

/**
 * Reusable name validation schema
 */
export const nameValidation = z
	.string()
	.trim()
	.max(50, "Name must be less than 50 characters")
	.regex(
		/^(?=.*[\p{L}\p{Sc}])[\p{L}\p{Sc}\s'\-().]+$/u,
		"Names must contain at least 1 letter and may only include letters, currency symbols, spaces, apostrophes, hyphens (-), periods (.), and parentheses ()."
	);

/**
 * Reusable email validation with lowercase enforcement
 */
export const lowercaseEmailValidation = z
	.email()
	.transform((val) => val.toLowerCase())
	.refine((val) => val === val.toLowerCase(), {
		message: "Email must be in lowercase",
	});

/**
 * Helper to properly coerce boolean from strings (handles "true"/"false" strings)
 * Needed for query parameters and form data where Express sends strings
 */
export const booleanCoercion = z.preprocess((val) => {
	if (val === "true" || val === true) return true;
	if (val === "false" || val === false) return false;
	return val; // Let Zod validation handle invalid values
}, z.boolean());

/**
 * Custom validator for role-based authorization
 */
export const roleValidator = (allowedRoles: UserRole[]) => {
	return z.array(z.custom<UserRole>()).refine((userRoles) => allowedRoles.some((role) => userRoles.includes(role)), {
		message: `You do not have the required authorization. Required roles: ${allowedRoles.join(", ")}`,
	});
};
