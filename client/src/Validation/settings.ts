import { CHECK_TTL_SENTINEL } from "@/Types/Check";
import { z } from "zod";

export const settingsSchema = z.object({
	systemEmailIgnoreTLS: z.boolean(),
	systemEmailRequireTLS: z.boolean(),
	systemEmailRejectUnauthorized: z.boolean(),
	systemEmailConnectionHost: z
		.string()
		.transform((val) => (val.trim() === "" ? null : val.trim()))
		.optional(),
	systemEmailSecure: z.boolean().optional(),
	systemEmailPool: z.boolean().optional(),
	showURL: z.boolean().optional(),
	defaultUserAgent: z
		.string()
		.max(500)
		.transform((val) => (val.trim() === "" ? null : val.trim()))
		.optional(),
	checkTTL: z
		.number()
		.int()
		.min(1, "Please enter a value")
		.max(CHECK_TTL_SENTINEL, `Maximum ${CHECK_TTL_SENTINEL}`),
	pagespeedApiKey: z
		.string()
		.transform((val) => (val.trim() === "" ? null : val.trim()))
		.optional(),
	systemEmailHost: z
		.string()
		.regex(/^[a-zA-Z0-9.-]*$/, "Invalid hostname or IP address")
		.transform((val) => (val.trim() === "" ? null : val.trim()))
		.optional(),
	systemEmailPort: z.number().int().min(1).max(65535).optional(),
	systemEmailAddress: z
		.email("Please enter a valid email address")
		.or(z.literal(""))
		.transform((val) => (val === "" ? null : val.toLowerCase().trim()))
		.optional(),
	systemEmailUser: z
		.string()
		.transform((val) => (val.trim() === "" ? null : val.trim()))
		.optional(),
	systemEmailPassword: z
		.string()
		.transform((val) => (val.trim() === "" ? null : val.trim()))
		.optional(),
	systemEmailTLSServername: z
		.string()
		.transform((val) => (val.trim() === "" ? null : val.trim()))
		.optional(),
	globalThresholds: z.object({
		cpu: z.number().int().min(1).max(100),
		memory: z.number().int().min(1).max(100),
		disk: z.number().int().min(1).max(100),
		temperature: z.number().int().min(1).max(150),
	}),
});

export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
