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
] as const;

export type SsoErrorCode = (typeof SsoErrorCodes)[number];

// Roles auto-provisioning may assign. superadmin is excluded so it can never mint an instance
// owner, and demo because a demo user cannot be deleted through the API.
export const OidcDefaultRoles = ["user", "admin"] as const satisfies readonly UserRole[];
export type OidcDefaultRole = (typeof OidcDefaultRoles)[number];

// How long a sign-in has to complete. The flow token's expiry and the cookie's max-age are both
// derived from this, so they cannot drift apart and strand a user mid-flow.
export const SSO_FLOW_TTL_SECONDS = 600;

// Where the provider sends the browser back. Pinned so OIDC_REDIRECT_URI can be checked at boot.
export const OIDC_CALLBACK_PATH = "/api/v1/auth/sso/callback";

// The identity the provider asserted, already normalised. Deliberately not the raw claim set:
// nothing downstream should be able to reach for a token or an arbitrary claim.
export type SsoClaims = {
	issuer: string;
	subject: string;
	email: string;
	// Carried through so account resolution can require it when taking over an existing account,
	// even where OIDC_REQUIRE_VERIFIED_EMAIL has relaxed the global check.
	emailVerified: boolean;
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
	defaultRole: OidcDefaultRole;
	allowInsecureIssuer: boolean;
};
