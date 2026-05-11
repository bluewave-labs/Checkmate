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

export const lowercaseEmailValidation = z.email().transform((val) => val.toLowerCase());

export const dnsServerValidation = z
	.string()
	.min(1, "DNS server is required")
	.refine((v) => z.ipv4().safeParse(v).success || z.ipv6().safeParse(v).success, "Enter a valid IPv4 or IPv6 address (e.g. 8.8.8.8)");

// Hostname (FQDN) — labels of 1-63 alphanumerics/hyphens separated by dots,
// no scheme, port, path, or whitespace. Total length ≤ 253. Kept in sync with
// the client-side regex in client/src/Validation/monitor.ts.
export const dnsHostnameRegex = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

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
