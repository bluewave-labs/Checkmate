import { z } from "zod";

export const settingsSchema = z.object({
	systemEmailIgnoreTLS: z.boolean(),
	systemEmailRequireTLS: z.boolean(),
	systemEmailRejectUnauthorized: z.boolean(),
	systemEmailConnectionHost: z.string().optional().or(z.literal("")),
	systemEmailSecure: z.boolean().optional(),
	systemEmailPool: z.boolean().optional(),
	showURL: z.boolean().optional(),
	checkTTL: z.coerce.number().int().min(1, "Please enter a value"),
	pagespeedApiKey: z.string().optional().or(z.literal("")),
	systemEmailHost: z.string().optional().or(z.literal("")),
	systemEmailPort: z.coerce.number().nullable().optional().or(z.literal("")),
	systemEmailAddress: z
		.email("Please enter a valid email address")
		.transform((val) => val.toLowerCase().trim())
		.optional()
		.or(z.literal("")),
	systemEmailUser: z.string().optional().or(z.literal("")),
	systemEmailPassword: z.string().optional().or(z.literal("")),
	systemEmailTLSServername: z.string().optional().or(z.literal("")),
	globalThresholds: z
		.object({
			cpu: z.coerce
				.number()
				.min(1, "Min 1%")
				.max(100, "Max 100%")
				.optional()
				.or(z.literal("")),
			memory: z.coerce
				.number()
				.min(1, "Min 1%")
				.max(100, "Max 100%")
				.optional()
				.or(z.literal("")),
			disk: z.coerce
				.number()
				.min(1, "Min 1%")
				.max(100, "Max 100%")
				.optional()
				.or(z.literal("")),
			temperature: z.coerce
				.number()
				.min(1, "Min 1°C")
				.max(150, "Max 150°C")
				.optional()
				.or(z.literal("")),
		})
		.optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
