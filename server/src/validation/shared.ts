import { z } from "zod";
import { type UserRole } from "@/types/user.js";

export const passwordPattern =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!?@#$%^&*()\-_=+[\]{};:'",.~`|\\/])[A-Za-z0-9!?@#$%^&*()\-_=+[\]{};:'",.~`|\\/]+$/;

export const nameValidation = z
	.string()
	.trim()
	.max(50, "Name must be less than 50 characters")
	.regex(
		/^(?=.*[\p{L}\p{Sc}])[\p{L}\p{Sc}\s'\-().]+$/u,
		"Names must contain at least 1 letter and may only include letters, currency symbols, spaces, apostrophes, hyphens (-), periods (.), and parentheses ()."
	);

export const lowercaseEmailValidation = z
	.string()
	.email()
	.transform((val) => val.toLowerCase());

export const booleanCoercion = z.preprocess((val) => {
	if (val === "true" || val === true) return true;
	if (val === "false" || val === false) return false;
	return val; // Let Zod validation handle invalid values
}, z.boolean());

export const roleValidator = (allowedRoles: UserRole[]) => {
	return z.array(z.custom<UserRole>()).refine((userRoles) => allowedRoles.some((role) => userRoles.includes(role)), {
		message: `You do not have the required authorization. Required roles: ${allowedRoles.join(", ")}`,
	});
};
