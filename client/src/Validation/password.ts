import { z } from "zod";
import { specialCharPattern } from "@/Validation/patterns";

export const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(1, "New password is required")
			.min(8, "Password must be at least 8 characters")
			.refine((val) => /[A-Z]/.test(val), "Password must contain an uppercase letter")
			.refine((val) => /[a-z]/.test(val), "Password must contain a lowercase letter")
			.refine((val) => /\d/.test(val), "Password must contain a number")
			.refine(
				(val) => specialCharPattern.test(val),
				"Password must contain a special character"
			),
		confirm: z.string().min(1, "Please confirm your new password"),
	})
	.refine((data) => data.newPassword === data.confirm, {
		message: "Passwords do not match",
		path: ["confirm"],
	});

export type PasswordFormData = z.infer<typeof passwordSchema>;
