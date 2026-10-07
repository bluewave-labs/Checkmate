import { z } from "zod";
import type * as openidClient from "openid-client";
import type jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError.js";
import type { ILogger } from "@/utils/logger.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { SSO_FLOW_TTL_SECONDS, type OidcConfig, type SsoClaims, type SsoErrorCode } from "@/types/sso.js";
import { ssoConfigResponseSchema } from "@/api/validation/authValidation.js";

const SERVICE_NAME = "SsoService";

// Seconds. openid-client defaults to 30, which is long enough for a slow provider to hold a
// request open and pin sockets; a sign-in redirect should fail fast and be retried by the user.
const REQUEST_TIMEOUT_SECONDS = 5;

const FLOW_TOKEN_PURPOSE = "sso-flow";

type JwtType = typeof jwt;

// Injected rather than imported so the service is unit-testable without jest.unstable_mockModule,
// matching how crypto, jsonwebtoken and gamedig are already wired in config/services.api.ts.
export type OidcLib = Pick<
	typeof openidClient,
	| "discovery"
	| "buildAuthorizationUrl"
	| "authorizationCodeGrant"
	| "fetchUserInfo"
	| "randomPKCECodeVerifier"
	| "calculatePKCECodeChallenge"
	| "randomState"
	| "randomNonce"
	| "allowInsecureRequests"
>;

export type SsoAuthorizationRequest = {
	authorizationUrl: string;
	flowToken: string;
};

// What the login page needs to decide whether to offer the button. Deliberately excludes the
// issuer and client id: this endpoint is unauthenticated.
export type SsoPublicConfig = z.infer<typeof ssoConfigResponseSchema>;

const flowTokenSchema = z.object({
	purpose: z.literal(FLOW_TOKEN_PURPOSE),
	state: z.string(),
	nonce: z.string(),
	codeVerifier: z.string(),
});

type FlowTokenPayload = z.infer<typeof flowTokenSchema>;

type RawProfileClaims = {
	email?: string;
	emailVerified?: boolean;
	givenName?: string;
	familyName?: string;
	name?: string;
};

// UserModel requires both name fields. Request validation does not run on this path, so a
// provider-supplied name is clamped here to the same 50 characters nameValidation allows,
// keeping SSO users editable through the profile form afterwards.
const NAME_MAX_LENGTH = 50;

const asString = (value: unknown): string | undefined => (typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined);

const readProfileClaims = (claims: Record<string, unknown>): RawProfileClaims => ({
	email: asString(claims.email),
	emailVerified: typeof claims.email_verified === "boolean" ? claims.email_verified : undefined,
	givenName: asString(claims.given_name),
	familyName: asString(claims.family_name),
	name: asString(claims.name),
});

// Trim and lowercase only, matching lowercaseEmailValidation, which is how local accounts are
// stored. Unicode compatibility folding is deliberately not applied: it maps separately-ownable
// code points onto ASCII, and folding only the provider's side of the comparison could let a
// lookalike address match an account it does not own.
const normalizeEmail = (email: string | undefined): string => (email ? email.trim().toLowerCase() : "");

const clampName = (value: string): string => value.slice(0, NAME_MAX_LENGTH);

// Falls back through the claims a provider might supply, ending at the email local part, because
// both name fields are required on the user document.
const splitName = (claims: RawProfileClaims, email: string): { firstName: string; lastName: string } => {
	if (claims.givenName || claims.familyName) {
		return {
			firstName: clampName(claims.givenName ?? claims.familyName ?? ""),
			lastName: clampName(claims.familyName ?? claims.givenName ?? ""),
		};
	}
	const parts = (claims.name ?? email.split("@")[0] ?? email).split(/\s+/).filter(Boolean);
	const first = parts[0] ?? email;
	const last = parts.length > 1 ? parts.slice(1).join(" ") : first;
	return { firstName: clampName(first), lastName: clampName(last) };
};

export interface ISsoService {
	getPublicConfig(): SsoPublicConfig;
	buildAuthorizationRequest(): Promise<SsoAuthorizationRequest>;
	exchangeCallback(callbackUrl: URL, flowToken: string | undefined): Promise<SsoClaims>;
}

export class SsoService implements ISsoService {
	static SERVICE_NAME = SERVICE_NAME;

	private oidc: OidcLib;
	private settingsService: ISettingsService;
	private jwt: JwtType;
	private logger: ILogger;

	// Saves a discovery round trip on every sign-in. openid-client refreshes the provider's keys
	// inside the Configuration, so this does not go stale. A failed discovery never assigns, so a
	// provider outage does not disable sign-in until restart.
	private configuration: openidClient.Configuration | null = null;

	constructor({ oidc, settingsService, jwt, logger }: { oidc: OidcLib; settingsService: ISettingsService; jwt: JwtType; logger: ILogger }) {
		this.oidc = oidc;
		this.settingsService = settingsService;
		this.jwt = jwt;
		this.logger = logger;
	}

	getPublicConfig = (): SsoPublicConfig => {
		const oidc = this.settingsService.getOidcConfig();
		return {
			enabled: oidc !== null,
			label: oidc?.buttonLabel ?? "",
			localLoginDisabled: oidc !== null && !oidc.allowLocalLogin,
		};
	};

	buildAuthorizationRequest = async (): Promise<SsoAuthorizationRequest> => {
		const method = "buildAuthorizationRequest";
		try {
			const oidc = this.requireConfig(method);
			const configuration = await this.getConfiguration(oidc);

			const codeVerifier = this.oidc.randomPKCECodeVerifier();
			const codeChallenge = await this.oidc.calculatePKCECodeChallenge(codeVerifier);
			const state = this.oidc.randomState();
			const nonce = this.oidc.randomNonce();

			// state is kept alongside PKCE: PKCE binds the code to this client, state binds the
			// response to this browser's flow.
			const authorizationUrl = this.oidc.buildAuthorizationUrl(configuration, {
				redirect_uri: oidc.redirectUri,
				scope: oidc.scopes,
				code_challenge: codeChallenge,
				code_challenge_method: "S256",
				state,
				nonce,
			});

			this.logger.debug({ message: "SSO login started", service: SERVICE_NAME, method });

			return {
				authorizationUrl: authorizationUrl.href,
				flowToken: this.signFlowToken({ purpose: FLOW_TOKEN_PURPOSE, state, nonce, codeVerifier }),
			};
		} catch (error: unknown) {
			throw this.rethrow(error, method, "exchange_failed", "Could not start the single sign-on flow");
		}
	};

	exchangeCallback = async (callbackUrl: URL, flowToken: string | undefined): Promise<SsoClaims> => {
		const method = "exchangeCallback";
		const oidc = this.requireConfig(method);
		const flow = this.verifyFlowToken(flowToken, method);

		let tokens: Awaited<ReturnType<OidcLib["authorizationCodeGrant"]>>;
		let configuration: openidClient.Configuration;
		try {
			configuration = await this.getConfiguration(oidc);
			// openid-client validates the id token here: signature against the provider's keys, plus
			// iss, aud, exp and the nonce and state we bound to this flow.
			tokens = await this.oidc.authorizationCodeGrant(configuration, callbackUrl, {
				pkceCodeVerifier: flow.codeVerifier,
				expectedNonce: flow.nonce,
				expectedState: flow.state,
				idTokenExpected: true,
			});
		} catch (error: unknown) {
			throw this.rethrow(error, method, "exchange_failed", "Could not complete the single sign-on flow");
		}

		const idTokenClaims = tokens.claims();
		if (!idTokenClaims) {
			throw this.fail(method, "exchange_failed", "The identity provider did not return an ID token");
		}

		const claims = await this.resolveClaims(configuration, tokens, idTokenClaims, method);

		// Checked before verification status, so an account with no email at all reports the accurate reason.
		const email = normalizeEmail(claims.email);
		if (!email) {
			throw this.fail(method, "no_email", "The identity provider did not return an email address");
		}

		// An absent claim is treated as unverified: the point of the check is that the provider has
		// asserted the address, and silence is not an assertion.
		if (oidc.requireVerifiedEmail && claims.emailVerified !== true) {
			throw this.fail(method, "email_unverified", "The identity provider has not verified this email address");
		}

		const { firstName, lastName } = splitName(claims, email);

		return {
			issuer: idTokenClaims.iss,
			subject: idTokenClaims.sub,
			email,
			emailVerified: claims.emailVerified === true,
			firstName,
			lastName,
		};
	};

	private requireConfig = (method: string): OidcConfig => {
		const oidc = this.settingsService.getOidcConfig();
		if (!oidc) {
			throw this.fail(method, "not_configured", "Single sign-on is not configured");
		}
		return oidc;
	};

	// Azure and some Okta configurations leave email out of the id token and only expose it at the
	// userinfo endpoint, so fall back there rather than failing an otherwise valid sign-in.
	private resolveClaims = async (
		configuration: openidClient.Configuration,
		tokens: Awaited<ReturnType<OidcLib["authorizationCodeGrant"]>>,
		idTokenClaims: openidClient.IDToken,
		method: string
	): Promise<RawProfileClaims> => {
		const fromIdToken = readProfileClaims(idTokenClaims);
		if (fromIdToken.email) {
			return fromIdToken;
		}

		try {
			const userInfo = await this.oidc.fetchUserInfo(configuration, tokens.access_token, idTokenClaims.sub);
			const fromUserInfo = readProfileClaims(userInfo);
			// Per field, not a spread: readProfileClaims materialises every key, so spreading would
			// overwrite a claim the ID token did supply with the undefined userinfo left out.
			return {
				email: fromUserInfo.email ?? fromIdToken.email,
				emailVerified: fromUserInfo.emailVerified ?? fromIdToken.emailVerified,
				givenName: fromUserInfo.givenName ?? fromIdToken.givenName,
				familyName: fromUserInfo.familyName ?? fromIdToken.familyName,
				name: fromUserInfo.name ?? fromIdToken.name,
			};
		} catch (error: unknown) {
			this.logger.warn({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method,
			});
			return fromIdToken;
		}
	};

	private verifyFlowToken = (flowToken: string | undefined, method: string): FlowTokenPayload => {
		if (!flowToken) {
			throw this.fail(method, "invalid_state", "This sign-in attempt has expired or was started in another browser");
		}
		const { jwtSecret } = this.settingsService.getSettings();
		try {
			return flowTokenSchema.parse(this.jwt.verify(flowToken, jwtSecret));
		} catch (error: unknown) {
			this.logger.warn({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method,
			});
			throw this.fail(method, "invalid_state", "This sign-in attempt has expired or was started in another browser");
		}
	};

	private getConfiguration = async (oidc: OidcConfig): Promise<openidClient.Configuration> => {
		this.configuration ??= await this.discover(oidc);
		return this.configuration;
	};

	private discover = async (oidc: OidcConfig): Promise<openidClient.Configuration> => {
		// The timeout has to be passed to discovery as well as set on the result: the discovery fetch
		// is the first network call of a cold sign-in and would otherwise run under the 30s default.
		// allowInsecureRequests likewise has to run via `execute`, during discovery — applying it to
		// the returned configuration would be too late, since the discovery fetch itself is what
		// rejects an http issuer.
		const configuration = await this.oidc.discovery(new URL(oidc.issuer), oidc.clientId, oidc.clientSecret, undefined, {
			timeout: REQUEST_TIMEOUT_SECONDS,
			...(oidc.allowInsecureIssuer && { execute: [this.oidc.allowInsecureRequests] }),
		});
		configuration.timeout = REQUEST_TIMEOUT_SECONDS;
		return configuration;
	};

	// Signed with the application secret and handed to the browser as an httpOnly cookie. It carries no
	// id, teamId or role, so verifyJWT's payload guard rejects it if anyone presents it as a Bearer token.
	private signFlowToken = (payload: FlowTokenPayload): string => {
		const { jwtSecret } = this.settingsService.getSettings();
		return this.jwt.sign(payload, jwtSecret, { expiresIn: SSO_FLOW_TTL_SECONDS });
	};

	private fail = (method: string, code: SsoErrorCode, message: string): AppError =>
		new AppError({ message, status: 401, service: SERVICE_NAME, method, details: { code } });

	// Keeps a deliberate SsoErrorCode intact and converts anything else into one, so a provider's own
	// error text never escapes this layer. The original message is logged, never returned.
	private rethrow = (error: unknown, method: string, code: SsoErrorCode, message: string): AppError => {
		if (error instanceof AppError) {
			return error;
		}
		this.logger.warn({
			message: error instanceof Error ? error.message : String(error),
			service: SERVICE_NAME,
			method,
			stack: error instanceof Error ? error.stack : undefined,
		});
		return this.fail(method, code, message);
	};
}
