import { z } from "zod";

//****************************************
// Settings Validations
//****************************************

export const updateAppSettingsBodyValidation = z
	.object({
		// Number or empty string fields
		checkTTL: z.union([z.number(), z.literal("")]).optional(),
		systemEmailPort: z.union([z.number(), z.literal("")]).optional(),

		// String or empty string fields
		pagespeedApiKey: z.union([z.string(), z.literal("")]).optional(),
		language: z.union([z.string(), z.literal("")]).optional(),
		timezone: z.union([z.string(), z.literal("")]).optional(),
		systemEmailHost: z.union([z.string(), z.literal("")]).optional(),
		systemEmailAddress: z.union([z.string(), z.literal("")]).optional(),
		systemEmailPassword: z.union([z.string(), z.literal("")]).optional(),
		systemEmailUser: z.union([z.string(), z.literal("")]).optional(),
		systemEmailConnectionHost: z.union([z.string(), z.literal("")]).optional(),
		systemEmailTLSServername: z.union([z.string(), z.literal("")]).optional(),

		// Boolean fields (optional by default in Joi)
		showURL: z.boolean().optional(),
		systemEmailSecure: z.boolean().optional(),
		systemEmailPool: z.boolean().optional(),
		systemEmailIgnoreTLS: z.boolean().optional(),
		systemEmailRequireTLS: z.boolean().optional(),
		systemEmailRejectUnauthorized: z.boolean().optional(),

		// Nested object
		globalThresholds: z
			.object({
				cpu: z.union([z.number().min(1).max(100), z.literal("")]).optional(),
				memory: z.union([z.number().min(1).max(100), z.literal("")]).optional(),
				disk: z.union([z.number().min(1).max(100), z.literal("")]).optional(),
				temperature: z.union([z.number().min(1).max(150), z.literal("")]).optional(),
			})
			.optional(),
	})
	.strip(); // Joi by default strips unknown keys, match that behavior with .strip()
