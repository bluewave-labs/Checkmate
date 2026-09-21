import { CHECK_TTL_SENTINEL } from "@/Types/Check";
import { z } from "zod";

export const EGRESS_TARGETS_MAX = 10;

// Follows the server's parseEgressTarget: an http(s) URL, host:port (or [ipv6]:port), or a bare host or
// IP address. Kept in step so that what the form accepts is what the server accepts.
const HOSTNAME_REGEX =
	/^(?=.{1,253}$)([a-zA-Z0-9_](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const IPV6_GROUP_REGEX = /^[0-9a-fA-F]{1,4}$/;
const HOST_PORT_REGEX = /^(?:\[([^\]]+)\]|([^:/\s[\]]+)):(\d{1,5})$/;
const BRACKETED_REGEX = /^\[([^\]]+)\]$/;

// Up to eight hex groups, with at most one "::" standing in for the missing ones.
const isIpv6 = (value: string) => {
	const halves = value.split("::");
	if (halves.length > 2) return false;
	const groups = halves.flatMap((half) => (half === "" ? [] : half.split(":")));
	if (!groups.every((group) => IPV6_GROUP_REGEX.test(group))) return false;
	return halves.length === 2 ? groups.length < 8 : groups.length === 8;
};
const isHostOrIpv4 = (value: string) =>
	value === "localhost" || IPV4_REGEX.test(value) || HOSTNAME_REGEX.test(value);

const isHttpUrl = (value: string) => {
	try {
		const { protocol, hostname } = new URL(value);
		return (protocol === "http:" || protocol === "https:") && hostname.length > 0;
	} catch {
		return false;
	}
};

export const isEgressTarget = (raw: string): boolean => {
	const target = raw.trim();
	if (target === "") return false;
	if (/^https?:\/\//i.test(target)) return isHttpUrl(target);
	const hostPort = HOST_PORT_REGEX.exec(target);
	if (hostPort) {
		const port = Number(hostPort[3]);
		if (port < 1 || port > 65535) return false;
		return hostPort[1] !== undefined ? isIpv6(hostPort[1]) : isHostOrIpv4(hostPort[2]);
	}
	const bracketed = BRACKETED_REGEX.exec(target);
	if (bracketed) return isIpv6(bracketed[1]);
	return isIpv6(target) || isHostOrIpv4(target);
};

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
		egressCheckTargets: z
			.string()
			.transform(splitEgressTargets)
			.pipe(
				z
					.array(
						z
							.string()
							.refine(
								isEgressTarget,
								"Each target must be a hostname or IP address, host:port, or http(s) URL"
							)
					)
					.max(EGRESS_TARGETS_MAX, `Maximum ${EGRESS_TARGETS_MAX} targets`)
			),
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
