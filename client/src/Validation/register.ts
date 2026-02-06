import { z } from "zod";

const namePattern = /^[\p{L}\p{M}''()\-\. ]+$/u;
const specialCharPattern = /[!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/]/;

export const registerSchema = z
	.object({
		firstName: z
			.string()
			.min(1, "First name is required")
			.max(50, "First name must be 50 characters or less")
			.regex(namePattern, "First name contains invalid characters")
			.transform((val) => val.trim()),
		lastName: z
			.string()
			.min(1, "Last name is required")
			.max(50, "Last name must be 50 characters or less")
			.regex(namePattern, "Last name contains invalid characters")
			.transform((val) => val.trim()),
		email: z
			.email("Please enter a valid email address")
			.min(1, "Email is required")
			.transform((val) => val.toLowerCase().trim()),
		password: z
			.string()
			.min(1, "Password is required")
			.min(8, "Password must be at least 8 characters")
			.refine((val) => /[A-Z]/.test(val), "Password must contain an uppercase letter")
			.refine((val) => /[a-z]/.test(val), "Password must contain a lowercase letter")
			.refine((val) => /\d/.test(val), "Password must contain a number")
			.refine(
				(val) => specialCharPattern.test(val),
				"Password must contain a special character"
			),
		confirm: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirm, {
		message: "Passwords do not match",
		path: ["confirm"],
	});

export type RegisterFormData = z.infer<typeof registerSchema>;
