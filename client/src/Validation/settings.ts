import { z } from "zod";

// Helper to normalize empty strings to undefined
const optionalString = () =>
	z.preprocess(
		(val) =>
			val === "" || val === null || val === undefined ? undefined : String(val).trim(),
		z.string().optional()
	);

// Helper for threshold fields
const thresholdField = (min: number, max: number, unit: string) =>
	z.preprocess(
		(val) => (val === "" || val === null || val === undefined ? undefined : val),
		z.coerce
			.number()
			.int()
			.min(min, `Min ${min}${unit}`)
			.max(max, `Max ${max}${unit}`)
			.optional()
	);

export const settingsSchema = z.object({
	systemEmailIgnoreTLS: z.boolean(),
	systemEmailRequireTLS: z.boolean(),
	systemEmailRejectUnauthorized: z.boolean(),
	systemEmailConnectionHost: optionalString(),
	systemEmailSecure: z.boolean().optional(),
	systemEmailPool: z.boolean().optional(),
	showURL: z.boolean().optional(),
	checkTTL: z.coerce
		.number()
		.int()
		.min(1, "Please enter a value")
		.max(365, "Maximum 365 days"),
	pagespeedApiKey: optionalString(),
	globalpingApiKey: optionalString(),
	systemEmailHost: z.preprocess(
		(val) =>
			val === "" || val === null || val === undefined ? undefined : String(val).trim(),
		z
			.string()
			.regex(/^[a-zA-Z0-9.-]+$/, "Invalid hostname or IP address")
			.optional()
	),
	systemEmailPort: z.preprocess(
		(val) => (val === "" || val === null || val === undefined ? undefined : val),
		z.coerce
			.number()
			.int()
			.min(1, "Port must be at least 1")
			.max(65535, "Port must be at most 65535")
			.optional()
	),
	systemEmailAddress: z.preprocess((val) => {
		if (val === "" || val === null || val === undefined) return undefined;
		return String(val).toLowerCase().trim();
	}, z.string().email("Please enter a valid email address").optional()),
	systemEmailUser: optionalString(),
	systemEmailPassword: optionalString(),
	systemEmailTLSServername: optionalString(),
	globalThresholds: z
		.object({
			cpu: thresholdField(0, 100, "%"),
			memory: thresholdField(0, 100, "%"),
			disk: thresholdField(0, 100, "%"),
			temperature: thresholdField(0, 150, "°C"),
		})
		.optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
