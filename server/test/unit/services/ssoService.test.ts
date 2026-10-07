import { describe, expect, it, jest } from "@jest/globals";
import { SsoService, type OidcLib } from "../../../src/service/sso/ssoService.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { OidcConfig } from "../../../src/types/sso.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeOidcConfig = (overrides?: Partial<OidcConfig>): OidcConfig => ({
	issuer: "https://auth.example.com/application/o/checkmate/",
	clientId: "checkmate",
	clientSecret: "client-secret",
	redirectUri: "https://checkmate.example.com/api/v1/auth/sso/callback",
	scopes: "openid profile email",
	buttonLabel: "Sign in with Authentik",
	allowLocalLogin: true,
	requireVerifiedEmail: true,
	autoProvision: false,
	defaultRole: "user",
	allowInsecureIssuer: false,
	...overrides,
});

const makeIdTokenClaims = (overrides?: Record<string, unknown>) => ({
	iss: "https://auth.example.com/application/o/checkmate/",
	sub: "provider-subject-1",
	aud: "checkmate",
	email: "Ada@Example.com",
	email_verified: true,
	given_name: "Ada",
	family_name: "Lovelace",
	...overrides,
});

const makeTokens = (claims: Record<string, unknown> | undefined = makeIdTokenClaims()) => ({
	access_token: "access-token-123",
	claims: () => claims,
});

const setup = (oidcConfig: OidcConfig | null = makeOidcConfig(), oidcOverrides?: Partial<OidcLib>) => {
	const configuration = { timeout: 30 } as unknown as Awaited<ReturnType<OidcLib["discovery"]>>;
	const oidc = {
		discovery: jest.fn().mockResolvedValue(configuration),
		buildAuthorizationUrl: jest.fn().mockReturnValue(new URL("https://auth.example.com/authorize?client_id=checkmate")),
		randomPKCECodeVerifier: jest.fn().mockReturnValue("verifier-123"),
		calculatePKCECodeChallenge: jest.fn().mockResolvedValue("challenge-123"),
		randomState: jest.fn().mockReturnValue("state-123"),
		randomNonce: jest.fn().mockReturnValue("nonce-123"),
		allowInsecureRequests: jest.fn(),
		authorizationCodeGrant: jest.fn().mockResolvedValue(makeTokens()),
		fetchUserInfo: jest.fn().mockResolvedValue({ sub: "provider-subject-1", email: "ada@example.com" }),
		...oidcOverrides,
	} as unknown as OidcLib;
	const settingsService = {
		getOidcConfig: jest.fn().mockReturnValue(oidcConfig),
		getSettings: jest.fn().mockReturnValue({ jwtSecret: "test-secret" }),
	};
	const jwt = {
		sign: jest.fn().mockReturnValue("flow-token-123"),
		verify: jest.fn().mockReturnValue({ purpose: "sso-flow", state: "state-123", nonce: "nonce-123", codeVerifier: "verifier-123" }),
	};
	const logger = createMockLogger();
	const service = new SsoService({
		oidc,
		settingsService: settingsService as never,
		jwt: jwt as never,
		logger,
	});
	return { service, oidc, settingsService, jwt, logger, configuration };
};

const expectSsoError = async (promise: Promise<unknown>, code: string) => {
	await expect(promise).rejects.toBeInstanceOf(AppError);
	const error = await promise.catch((caught: unknown) => caught as AppError);
	expect(error.details).toEqual({ code });
	expect(error.service).toBe("SsoService");
	return error;
};

// ── getPublicConfig ──────────────────────────────────────────────────────────

describe("SsoService.getPublicConfig", () => {
	it("reports disabled when no provider is configured", () => {
		const { service } = setup(null);
		expect(service.getPublicConfig()).toEqual({ enabled: false, label: "", localLoginDisabled: false });
	});

	it("reports the button label when enabled", () => {
		const { service } = setup();
		expect(service.getPublicConfig()).toEqual({ enabled: true, label: "Sign in with Authentik", localLoginDisabled: false });
	});

	it("reports local login as disabled only when sso is on and local login is off", () => {
		const { service } = setup(makeOidcConfig({ allowLocalLogin: false }));
		expect(service.getPublicConfig().localLoginDisabled).toBe(true);
	});

	// This endpoint is unauthenticated, so it must never expose the provider details.
	it("never exposes the issuer, client id or secret", () => {
		const { service } = setup();
		expect(JSON.stringify(service.getPublicConfig())).not.toMatch(/auth\.example\.com|checkmate-secret|client-secret/);
	});
});

// ── buildAuthorizationRequest ────────────────────────────────────────────────

describe("SsoService.buildAuthorizationRequest", () => {
	it("throws not_configured when sso is off", async () => {
		const { service } = setup(null);
		await expectSsoError(service.buildAuthorizationRequest(), "not_configured");
	});

	it("requests the authorization url with PKCE S256, state and nonce", async () => {
		const { service, oidc, configuration } = setup();

		const result = await service.buildAuthorizationRequest();

		expect(oidc.buildAuthorizationUrl).toHaveBeenCalledWith(configuration, {
			redirect_uri: "https://checkmate.example.com/api/v1/auth/sso/callback",
			scope: "openid profile email",
			code_challenge: "challenge-123",
			code_challenge_method: "S256",
			state: "state-123",
			nonce: "nonce-123",
		});
		expect(result.authorizationUrl).toBe("https://auth.example.com/authorize?client_id=checkmate");
	});

	it("binds the verifier, state and nonce into a short-lived flow token", async () => {
		const { service, jwt } = setup();

		const result = await service.buildAuthorizationRequest();

		expect(jwt.sign).toHaveBeenCalledWith(
			{ purpose: "sso-flow", state: "state-123", nonce: "nonce-123", codeVerifier: "verifier-123" },
			"test-secret",
			{ expiresIn: 600 }
		);
		expect(result.flowToken).toBe("flow-token-123");
	});

	// verifyJWT accepts any payload carrying id, teamId and role. The flow token must carry none of
	// them, or it would double as a session credential for every authenticated route.
	it("signs a flow token that cannot pass as a session token", async () => {
		const { service, jwt } = setup();

		await service.buildAuthorizationRequest();

		const [payload] = (jwt.sign as jest.Mock).mock.calls[0] as [Record<string, unknown>];
		expect(payload).not.toHaveProperty("id");
		expect(payload).not.toHaveProperty("teamId");
		expect(payload).not.toHaveProperty("role");
	});

	it("shortens the request timeout from the library default", async () => {
		const { service, configuration } = setup();

		await service.buildAuthorizationRequest();

		expect(configuration.timeout).toBe(5);
	});

	it("discovers once and reuses the configuration across sign-ins", async () => {
		const { service, oidc } = setup();

		await service.buildAuthorizationRequest();
		await service.buildAuthorizationRequest();

		expect(oidc.discovery).toHaveBeenCalledTimes(1);
		expect(oidc.discovery).toHaveBeenCalledWith(new URL("https://auth.example.com/application/o/checkmate/"), "checkmate", "client-secret");
	});

	it("collapses concurrent sign-ins into a single discovery", async () => {
		const { service, oidc } = setup();

		await Promise.all([service.buildAuthorizationRequest(), service.buildAuthorizationRequest()]);

		expect(oidc.discovery).toHaveBeenCalledTimes(1);
	});

	// A cached rejection would disable sign-in until the process restarts.
	it("retries discovery after a failure instead of caching it", async () => {
		const discovery = jest
			.fn()
			.mockRejectedValueOnce(new Error("provider unreachable"))
			.mockResolvedValue({ timeout: 30 } as never);
		const { service, oidc } = setup(makeOidcConfig(), { discovery: discovery as never });

		await expectSsoError(service.buildAuthorizationRequest(), "exchange_failed");
		await expect(service.buildAuthorizationRequest()).resolves.toMatchObject({ flowToken: "flow-token-123" });
		expect(oidc.discovery).toHaveBeenCalledTimes(2);
	});

	// The provider's own message can be attacker-influenced and must not reach the browser.
	it("logs the underlying failure but does not surface its message", async () => {
		const discovery = jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.1:443"));
		const { service, logger } = setup(makeOidcConfig(), { discovery: discovery as never });

		const error = await expectSsoError(service.buildAuthorizationRequest(), "exchange_failed");

		expect(error.message).toBe("Could not start the single sign-on flow");
		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "connect ECONNREFUSED 10.0.0.1:443" }));
	});

	it("relaxes transport security only when the operator opts in", async () => {
		const secure = setup();
		await secure.service.buildAuthorizationRequest();
		expect(secure.oidc.allowInsecureRequests).not.toHaveBeenCalled();

		const insecure = setup(makeOidcConfig({ allowInsecureIssuer: true }));
		await insecure.service.buildAuthorizationRequest();
		expect(insecure.oidc.allowInsecureRequests).toHaveBeenCalledWith(insecure.configuration);
	});
});

// ── exchangeCallback ─────────────────────────────────────────────────────────

const CALLBACK_URL = new URL("https://checkmate.example.com/api/v1/auth/sso/callback?code=abc&state=state-123");

describe("SsoService.exchangeCallback", () => {
	it("throws not_configured when sso is off", async () => {
		const { service } = setup(null);
		await expectSsoError(service.exchangeCallback(CALLBACK_URL, "flow-token-123"), "not_configured");
	});

	it("throws invalid_state when the flow cookie is missing", async () => {
		const { service, oidc } = setup();
		await expectSsoError(service.exchangeCallback(CALLBACK_URL, undefined), "invalid_state");
		expect(oidc.authorizationCodeGrant).not.toHaveBeenCalled();
	});

	it("throws invalid_state when the flow token is expired or tampered with", async () => {
		const { service, jwt } = setup();
		(jwt.verify as jest.Mock).mockImplementation(() => {
			throw new Error("jwt expired");
		});
		await expectSsoError(service.exchangeCallback(CALLBACK_URL, "flow-token-123"), "invalid_state");
	});

	// A token signed with the same secret but minted for a different purpose must not be accepted here.
	it("throws invalid_state when the token is not an sso-flow token", async () => {
		const { service, jwt } = setup();
		(jwt.verify as jest.Mock).mockReturnValue({ id: "user-1", teamId: "team-1", role: ["superadmin"] });
		await expectSsoError(service.exchangeCallback(CALLBACK_URL, "session-token"), "invalid_state");
	});

	it("binds the verifier, nonce and state from the flow token into the code exchange", async () => {
		const { service, oidc, configuration } = setup();

		await service.exchangeCallback(CALLBACK_URL, "flow-token-123");

		expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(configuration, CALLBACK_URL, {
			pkceCodeVerifier: "verifier-123",
			expectedNonce: "nonce-123",
			expectedState: "state-123",
			idTokenExpected: true,
		});
	});

	it("returns the subject, issuer, normalised email and name", async () => {
		const { service } = setup();

		await expect(service.exchangeCallback(CALLBACK_URL, "flow-token-123")).resolves.toEqual({
			issuer: "https://auth.example.com/application/o/checkmate/",
			subject: "provider-subject-1",
			email: "ada@example.com",
			firstName: "Ada",
			lastName: "Lovelace",
		});
	});

	it("rejects an email the provider says is unverified", async () => {
		const authorizationCodeGrant = jest.fn().mockResolvedValue(makeTokens(makeIdTokenClaims({ email_verified: false })));
		const { service } = setup(makeOidcConfig(), { authorizationCodeGrant: authorizationCodeGrant as never });
		await expectSsoError(service.exchangeCallback(CALLBACK_URL, "flow-token-123"), "email_unverified");
	});

	// Silence is not an assertion: an absent claim is treated as unverified.
	it("rejects a missing email_verified claim unless the operator opts out", async () => {
		const authorizationCodeGrant = jest.fn().mockResolvedValue(makeTokens(makeIdTokenClaims({ email_verified: undefined })));

		const strict = setup(makeOidcConfig(), { authorizationCodeGrant: authorizationCodeGrant as never });
		await expectSsoError(strict.service.exchangeCallback(CALLBACK_URL, "flow-token-123"), "email_unverified");

		const relaxed = setup(makeOidcConfig({ requireVerifiedEmail: false }), { authorizationCodeGrant: authorizationCodeGrant as never });
		await expect(relaxed.service.exchangeCallback(CALLBACK_URL, "flow-token-123")).resolves.toMatchObject({ email: "ada@example.com" });
	});

	it("falls back to userinfo when the id token carries no email", async () => {
		const authorizationCodeGrant = jest.fn().mockResolvedValue(makeTokens(makeIdTokenClaims({ email: undefined })));
		const fetchUserInfo = jest.fn().mockResolvedValue({ sub: "provider-subject-1", email: "ada@example.com", email_verified: true });
		const { service, oidc } = setup(makeOidcConfig(), {
			authorizationCodeGrant: authorizationCodeGrant as never,
			fetchUserInfo: fetchUserInfo as never,
		});

		await expect(service.exchangeCallback(CALLBACK_URL, "flow-token-123")).resolves.toMatchObject({ email: "ada@example.com" });
		expect(oidc.fetchUserInfo).toHaveBeenCalledWith(expect.anything(), "access-token-123", "provider-subject-1");
	});

	it("throws no_email when neither the id token nor userinfo supplies one", async () => {
		const authorizationCodeGrant = jest.fn().mockResolvedValue(makeTokens(makeIdTokenClaims({ email: undefined })));
		const fetchUserInfo = jest.fn().mockResolvedValue({ sub: "provider-subject-1" });
		const { service } = setup(makeOidcConfig(), {
			authorizationCodeGrant: authorizationCodeGrant as never,
			fetchUserInfo: fetchUserInfo as never,
		});

		await expectSsoError(service.exchangeCallback(CALLBACK_URL, "flow-token-123"), "no_email");
	});

	it("throws exchange_failed when the provider rejects the code", async () => {
		const authorizationCodeGrant = jest.fn().mockRejectedValue(new Error("invalid_grant"));
		const { service } = setup(makeOidcConfig(), { authorizationCodeGrant: authorizationCodeGrant as never });

		const error = await expectSsoError(service.exchangeCallback(CALLBACK_URL, "flow-token-123"), "exchange_failed");
		expect(error.message).not.toContain("invalid_grant");
	});

	it("throws exchange_failed when no id token comes back", async () => {
		// Built inline: makeTokens() would fall back to its default claim set.
		const authorizationCodeGrant = jest.fn().mockResolvedValue({ access_token: "access-token-123", claims: () => undefined });
		const { service } = setup(makeOidcConfig(), { authorizationCodeGrant: authorizationCodeGrant as never });
		await expectSsoError(service.exchangeCallback(CALLBACK_URL, "flow-token-123"), "exchange_failed");
	});

	// Lookalike forms would otherwise create a second account for the same person.
	it("normalises the email to NFKC lowercase", async () => {
		const authorizationCodeGrant = jest.fn().mockResolvedValue(makeTokens(makeIdTokenClaims({ email: "  ADA@Example.COM  " })));
		const { service } = setup(makeOidcConfig(), { authorizationCodeGrant: authorizationCodeGrant as never });

		await expect(service.exchangeCallback(CALLBACK_URL, "flow-token-123")).resolves.toMatchObject({ email: "ada@example.com" });
	});

	it("derives a name from the display name, then from the email local part", async () => {
		const fromName = jest
			.fn()
			.mockResolvedValue(makeTokens(makeIdTokenClaims({ given_name: undefined, family_name: undefined, name: "Ada Lovelace" })));
		const named = setup(makeOidcConfig(), { authorizationCodeGrant: fromName as never });
		await expect(named.service.exchangeCallback(CALLBACK_URL, "flow-token-123")).resolves.toMatchObject({
			firstName: "Ada",
			lastName: "Lovelace",
		});

		const bare = jest.fn().mockResolvedValue(makeTokens(makeIdTokenClaims({ given_name: undefined, family_name: undefined, name: undefined })));
		const anonymous = setup(makeOidcConfig(), { authorizationCodeGrant: bare as never });
		await expect(anonymous.service.exchangeCallback(CALLBACK_URL, "flow-token-123")).resolves.toMatchObject({
			firstName: "ada",
			lastName: "ada",
		});
	});

	// nameValidation caps names at 50 characters and the user document requires both fields.
	it("clamps a provider-supplied name to the length the user document allows", async () => {
		const long = "A".repeat(80);
		const authorizationCodeGrant = jest.fn().mockResolvedValue(makeTokens(makeIdTokenClaims({ given_name: long, family_name: long })));
		const { service } = setup(makeOidcConfig(), { authorizationCodeGrant: authorizationCodeGrant as never });

		const claims = await service.exchangeCallback(CALLBACK_URL, "flow-token-123");
		expect(claims.firstName).toHaveLength(50);
		expect(claims.lastName).toHaveLength(50);
	});
});
