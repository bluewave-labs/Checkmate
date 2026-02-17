import { z } from "zod";

export const recoverySchema = z.object({
	email: z
		.email("Please enter a valid email address")
		.min(1, "Please enter your email address")
		.transform((val) => val.toLowerCase().trim()),
});

export type RecoveryFormData = z.infer<typeof recoverySchema>;
