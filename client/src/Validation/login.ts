import { z } from "zod";

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, "auth.common.inputs.email.errors.empty")
		.email("auth.common.inputs.email.errors.invalid")
		.transform((val) => val.toLowerCase().trim()),
	password: z.string().min(1, "auth.common.inputs.password.errors.empty"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
