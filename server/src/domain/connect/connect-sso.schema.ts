import { z } from "zod";
import { SsoCheckStatuses, SsoProviders, SsoRoles } from "@/domain/sso/sso.type.js";

// ************************
// Connect API responses
// ************************

// Response for GET /api/agent/sso/config
export const connectSsoConfigSchema = z.object({
	enabled: z.boolean(),
	provider: z.enum(SsoProviders).nullable(),
	label: z.string().nullable(),
	enforce: z.boolean(),
	graceUntil: z.string().nullable(),
	startUrl: z.url({ protocol: /^https?$/ }).nullable(),
});

// The identity Connect verified at the IdP
export const connectSsoIdentitySchema = z.object({
	provider: z.enum(SsoProviders),
	tenant: z.string(),
	subject: z.string(),
	email: z.email(),
	firstName: z.string(),
	lastName: z.string(),
	role: z.enum(SsoRoles),
	roleManaged: z.boolean(),
});

// Response for POST /api/agent/sso/redeem
export const connectSsoRedeemSchema = z.object({
	identity: connectSsoIdentitySchema,
});

export const connectSsoSubjectSchema = z.object({
	provider: z.enum(SsoProviders),
	tenant: z.string(),
	subject: z.string(),
});

export const connectSsoCheckResultSchema = connectSsoSubjectSchema.extend({
	status: z.enum(SsoCheckStatuses),
	role: z.enum(SsoRoles).nullable(),
	roleManaged: z.boolean(),
});

// Response for POST /api/agent/sso/check
export const connectSsoCheckSchema = z.object({
	results: z.array(connectSsoCheckResultSchema),
});
