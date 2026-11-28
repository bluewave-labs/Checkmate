import { z } from "zod";
import { specialCharPattern } from "@/Validation/patterns";

const newPasswordRule = z
	.string()
	.min(1, "New password is required")
	.min(8, "Password must be at least 8 characters")
	.refine((val) => /[A-Z]/.test(val), "Password must contain an uppercase letter")
	.refine((val) => /[a-z]/.test(val), "Password must contain a lowercase letter")
	.refine((val) => /\d/.test(val), "Password must contain a number")
	.refine(
		(val) => specialCharPattern.test(val),
		"Password must contain a special character"
	);

export const setPasswordSchema = z.object({ password: newPasswordRule });

export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

export const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: newPasswordRule,
		confirm: z.string().min(1, "Please confirm your new password"),
	})
	.refine((data) => data.newPassword === data.confirm, {
		message: "Passwords do not match",
		path: ["confirm"],
	});

export type PasswordFormData = z.infer<typeof passwordSchema>;
