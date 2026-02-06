import { z } from "zod";

export const recoverySchema = z.object({
	email: z
		.string()
		.min(1, "auth.common.inputs.email.errors.empty")
		.email("auth.common.inputs.email.errors.invalid")
		.transform((val) => val.toLowerCase().trim()),
});

export type RecoveryFormData = z.infer<typeof recoverySchema>;
