import { z } from "zod";

export const loginSchema = z.object({
	email: z
		.email("Please enter a valid email address")
		.min(1, "Please enter your email address")
		.transform((val) => val.toLowerCase().trim()),
	password: z.string().min(1, "Please enter your password"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
