import { z } from "zod";

export const settingsSchema = z.object({
	systemEmailIgnoreTLS: z.boolean(),
	systemEmailRequireTLS: z.boolean(),
	systemEmailRejectUnauthorized: z.boolean(),
	systemEmailConnectionHost: z
		.string()
		.transform((val) => (val.trim() === "" ? undefined : val.trim()))
		.optional(),
	systemEmailSecure: z.boolean().optional(),
	systemEmailPool: z.boolean().optional(),
	showURL: z.boolean().optional(),
	checkTTL: z.number().int().min(1, "Please enter a value").max(365, "Maximum 365 days"),
	pagespeedApiKey: z
		.string()
		.transform((val) => (val.trim() === "" ? undefined : val.trim()))
		.optional(),
	systemEmailHost: z
		.string()
		.regex(/^[a-zA-Z0-9.-]*$/, "Invalid hostname or IP address")
		.transform((val) => (val.trim() === "" ? undefined : val.trim()))
		.optional(),
	systemEmailPort: z.number().int().min(1).max(65535).optional(),
	systemEmailAddress: z
		.string()
		.email("Please enter a valid email address")
		.or(z.literal(""))
		.transform((val) => (val === "" ? undefined : val.toLowerCase().trim()))
		.optional(),
	systemEmailUser: z
		.string()
		.transform((val) => (val.trim() === "" ? undefined : val.trim()))
		.optional(),
	systemEmailPassword: z
		.string()
		.transform((val) => (val.trim() === "" ? undefined : val.trim()))
		.optional(),
	systemEmailTLSServername: z
		.string()
		.transform((val) => (val.trim() === "" ? undefined : val.trim()))
		.optional(),
	globalThresholds: z
		.object({
			cpu: z
				.number()
				.int()
				.min(1, "Please enter a value")
				.max(100, "Maximum value is 100")
				.optional(),
			memory: z
				.number()
				.int()
				.min(1, "Please enter a value")
				.max(100, "Maximum value is 100")
				.optional(),
			disk: z
				.number()
				.int()
				.min(1, "Please enter a value")
				.max(100, "Maximum value is 100")
				.optional(),
			temperature: z
				.number()
				.int()
				.min(1, "Please enter a value")
				.max(150, "Maximum value is 150")
				.optional(),
		})
		.optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
