import type { UserRole } from "@/domain/users/user.type.js";

// Reasons an SSO login can fail. The callback redirects to the login page with one of these
// as ?sso_error=<code>; the client looks up a translated message by code. Never send the
// identity provider's own error text back to the browser.
export const SsoErrorCodes = [
	"not_configured",
	"invalid_state",
	"exchange_failed",
	"no_email",
	"email_unverified",
	"not_invited",
	"not_initialized",
	"rate_limited",
] as const;

export type SsoErrorCode = (typeof SsoErrorCodes)[number];

// The identity the provider asserted, already normalised. Deliberately not the raw claim set:
// nothing downstream should be able to reach for a token or an arbitrary claim.
export type SsoClaims = {
	issuer: string;
	subject: string;
	email: string;
	firstName: string;
	lastName: string;
};

// Resolved OIDC configuration, or null when OIDC_ENABLED is false. Built once at boot from the
// environment, so it cannot change midway through a redirect the way cached DB settings could.
export type OidcConfig = {
	issuer: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	buttonLabel: string;
	allowLocalLogin: boolean;
	requireVerifiedEmail: boolean;
	autoProvision: boolean;
	defaultRole: Extract<UserRole, "user" | "admin">;
	allowInsecureIssuer: boolean;
};
