import { z } from "zod";
import { specialCharPattern } from "@/Validation/patterns";

export const setNewPasswordSchema = z
	.object({
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

export type SetNewPasswordFormData = z.infer<typeof setNewPasswordSchema>;
