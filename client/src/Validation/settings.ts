import { z } from "zod";

export const settingsSchema = z.object({
	systemEmailIgnoreTLS: z.boolean(),
	systemEmailRequireTLS: z.boolean(),
	systemEmailRejectUnauthorized: z.boolean(),
	systemEmailConnectionHost: z.string().optional().or(z.literal("")),
	systemEmailSecure: z.boolean().optional(),
	systemEmailPool: z.boolean().optional(),
	showURL: z.boolean().optional(),
	timezone: z.string().min(1, "Timezone is required").optional(),
	mode: z.enum(["light", "dark"]).optional(),
	language: z.string().min(2, "Language is required"),
	chartType: z.enum(["histogram", "heatmap"]).optional(),
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
			cpu: z.coerce.number().min(1).max(100).optional(),
			memory: z.coerce.number().min(1).max(100).optional(),
			disk: z.coerce.number().min(1).max(100).optional(),
			temperature: z.coerce.number().min(1).max(150).optional(),
		})
		.optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
