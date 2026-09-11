import { CHECK_TTL_SENTINEL } from "@/Types/Check";
import { z } from "zod";

export const EGRESS_TARGETS_MIN = 1;
export const EGRESS_TARGETS_MAX = 10;
export const EGRESS_POLL_INTERVAL_MIN = 5;
export const EGRESS_POLL_INTERVAL_MAX = 600;

// Mirrors the server-side target format: bare host/IP, host:port, or http(s) URL.
const EGRESS_TARGET_REGEX = /^(https?:\/\/\S+|[A-Za-z0-9.\-:[\]]+)$/;

const splitEgressTargets = (raw: string): string[] =>
	Array.from(
		new Set(
			raw
				.split(/[\s,]+/)
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
		egressCheckTargets: z
			.string()
			.transform(splitEgressTargets)
			.pipe(
				z
					.array(
						z
							.string()
							.regex(
								EGRESS_TARGET_REGEX,
								"Each target must be a host, IP, host:port, or http(s) URL"
							)
					)
					.max(EGRESS_TARGETS_MAX, `Maximum ${EGRESS_TARGETS_MAX} targets`)
			),
		egressPollIntervalSeconds: z
			.number()
			.int()
			.min(EGRESS_POLL_INTERVAL_MIN, `Minimum ${EGRESS_POLL_INTERVAL_MIN} seconds`)
			.max(EGRESS_POLL_INTERVAL_MAX, `Maximum ${EGRESS_POLL_INTERVAL_MAX} seconds`),
		egressNotifications: z.array(z.string()),
	})
	.superRefine((body, ctx) => {
		if (
			body.egressCheckEnabled === true &&
			body.egressCheckTargets.length < EGRESS_TARGETS_MIN
		) {
			ctx.addIssue({
				code: "custom",
				path: ["egressCheckTargets"],
				message: "Enter at least one target to enable the egress self-check",
			});
		}
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
