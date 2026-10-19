import { CHECK_TTL_SENTINEL } from "@/Types/Check";
import { z } from "zod";

export const EGRESS_TARGETS_MAX = 10;
// The server caps each target at this length.
export const EGRESS_TARGET_MAX_LENGTH = 253;

// One target per line. Commas are not separators, since a URL may carry one in its query string.
const splitEgressTargets = (raw: string): string[] =>
	Array.from(
		new Set(
			raw
				.split(/\r?\n/)
				.map((entry) => entry.trim())
				.filter((entry) => entry !== "")
		)
	);

export const settingsSchema = z
	.object({
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
		systemEmailDisplayName: z
			.string()
			.max(100, "Display name must be 100 characters or fewer")
			.transform((val) => (val.trim() === "" ? null : val.trim()))
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
		globalProxyEnabled: z.boolean(),
		globalProxyId: z.string().nullable().optional(),
		egressCheckEnabled: z.boolean(),
		// Reported on the field rather than per item: the form edits all targets in one textarea, so an
		// error at egressCheckTargets.<index> would have nowhere to show.
		egressCheckTargets: z
			.string()
			.transform(splitEgressTargets)
			.superRefine((targets, ctx) => {
				if (targets.length > EGRESS_TARGETS_MAX) {
					ctx.addIssue({
						code: "custom",
						message: `Maximum ${EGRESS_TARGETS_MAX} targets`,
					});
				}
				if (targets.some((target) => target.length > EGRESS_TARGET_MAX_LENGTH)) {
					ctx.addIssue({
						code: "custom",
						message: `Each target must be ${EGRESS_TARGET_MAX_LENGTH} characters or fewer`,
					});
				}
				// Only a quick shape check here; the server parses each target fully and its error is shown on the field.
				const invalid = targets.find((target) => /\s/.test(target));
				if (invalid !== undefined) {
					ctx.addIssue({
						code: "custom",
						message: `"${invalid}" is not a hostname or IP address, host:port, or http(s) URL`,
					});
				}
			}),
		egressNotifications: z.array(z.string()),
	})
	.superRefine((body, ctx) => {
		if (body.globalProxyEnabled === true && !body.globalProxyId) {
			ctx.addIssue({
				code: "custom",
				path: ["globalProxyId"],
				message: "A proxy must be selected to enable the global proxy",
			});
		}
	});

export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
