import { CHECK_TTL_SENTINEL } from "@/types/check.js";
import { z } from "zod";

//****************************************
// Settings Validations
//****************************************

export const updateAppSettingsBodyValidation = z
	.object({
		checkTTL: z.number().int().min(1).max(CHECK_TTL_SENTINEL).optional(),
		systemEmailPort: z.number().optional(),
		pagespeedApiKey: z.string().optional(),
		language: z.string().optional(),
		timezone: z.string().optional(),
		systemEmailHost: z.string().optional(),
		systemEmailAddress: z.string().optional(),
		systemEmailPassword: z.string().optional(),
		systemEmailUser: z.string().optional(),
		systemEmailConnectionHost: z.string().optional(),
		systemEmailTLSServername: z.string().optional(),

		showURL: z.boolean().optional(),
		systemEmailSecure: z.boolean().optional(),
		systemEmailPool: z.boolean().optional(),
		systemEmailIgnoreTLS: z.boolean().optional(),
		systemEmailRequireTLS: z.boolean().optional(),
		systemEmailRejectUnauthorized: z.boolean().optional(),

		globalThresholds: z
			.object({
				cpu: z.union([z.number().min(1).max(100)]).optional(),
				memory: z.union([z.number().min(1).max(100)]).optional(),
				disk: z.union([z.number().min(1).max(100)]).optional(),
				temperature: z.union([z.number().min(1).max(150)]).optional(),
			})
			.optional(),
	})
	.strip();
