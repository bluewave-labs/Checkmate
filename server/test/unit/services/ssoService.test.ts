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
		...oidcOverrides,
	} as unknown as OidcLib;
	const settingsService = {
		getOidcConfig: jest.fn().mockReturnValue(oidcConfig),
		getSettings: jest.fn().mockReturnValue({ jwtSecret: "test-secret" }),
	};
	const jwt = { sign: jest.fn().mockReturnValue("flow-token-123") };
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
