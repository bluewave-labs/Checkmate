import { CHECK_TTL_SENTINEL } from "@/domain/checks/check.type.js";
import { MAX_EGRESS_POLL_INTERVAL_SECONDS, MAX_EGRESS_TARGETS, MIN_EGRESS_POLL_INTERVAL_SECONDS } from "@/domain/egress/egress.type.js";
import { z } from "zod";

// A reliability target is a bare host/IP (ICMP ping), host:port (TCP connect) or an http(s) URL.
const egressTargetValidation = z
	.string()
	.trim()
	.min(1)
	.max(253)
	.regex(/^(https?:\/\/\S+|[A-Za-z0-9.\-:[\]]+)$/, "Invalid egress target");

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
		globalProxyEnabled: z.boolean().optional(),
		globalProxyId: z.string().nullable().optional(),

		egressCheckEnabled: z.boolean().optional(),
		egressCheckTargets: z.array(egressTargetValidation).max(MAX_EGRESS_TARGETS).optional(), // empty list falls back to DEFAULT_EGRESS_TARGETS
		egressPollIntervalSeconds: z.number().int().min(MIN_EGRESS_POLL_INTERVAL_SECONDS).max(MAX_EGRESS_POLL_INTERVAL_SECONDS).optional(),
		egressNotifications: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid notification id")).optional(),
	})
	.strip()
	.superRefine((body, ctx) => {
		if (body.globalProxyEnabled === true && !body.globalProxyId) {
			ctx.addIssue({
				code: "custom",
				path: ["globalProxyId"],
				message: "A proxy must be selected to enable the global proxy",
			});
		}
	});
