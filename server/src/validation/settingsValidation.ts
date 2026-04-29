import { CHECK_TTL_SENTINEL } from "@/types/check.js";
import { z } from "zod";

//****************************************
// Settings Validations
//****************************************

export const updateAppSettingsBodyValidation = z
	.object({
		checkTTL: z.number().int().min(1).max(CHECK_TTL_SENTINEL).optional(),
		systemEmailPort: z.number().nullable().optional(),
		pagespeedApiKey: z.string().nullable().optional(),
		language: z.string().optional(),
		timezone: z.string().optional(),
		systemEmailHost: z.string().nullable().optional(),
		systemEmailAddress: z.string().nullable().optional(),
		systemEmailDisplayName: z
			.string()
			.max(100)
			.transform((val) => (val.trim() === "" ? null : val.trim()))
			.nullable()
			.optional(),
		systemEmailPassword: z.string().nullable().optional(),
		systemEmailUser: z.string().nullable().optional(),
		systemEmailConnectionHost: z.string().nullable().optional(),
		systemEmailTLSServername: z.string().nullable().optional(),

		showURL: z.boolean().optional(),
		systemEmailSecure: z.boolean().optional(),
		systemEmailPool: z.boolean().optional(),
		systemEmailIgnoreTLS: z.boolean().optional(),
		systemEmailRequireTLS: z.boolean().optional(),
		systemEmailRejectUnauthorized: z.boolean().optional(),

		globalThresholds: z
			.object({
				cpu: z.number().min(1).max(100).optional(),
				memory: z.number().min(1).max(100).optional(),
				disk: z.number().min(1).max(100).optional(),
				temperature: z.number().min(1).max(150).optional(),
			})
			.optional(),
	})
	.strip();
