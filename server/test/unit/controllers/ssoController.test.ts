import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import SsoController from "../../../src/api/controllers/ssoController.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import type { OidcConfig } from "../../../src/types/sso.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const REDIRECT_URI = "https://checkmate.example.com/api/v1/auth/sso/callback";

const makeOidcConfig = (overrides?: Partial<OidcConfig>): OidcConfig => ({
	issuer: "https://auth.example.com/",
	clientId: "checkmate",
	clientSecret: "client-secret",
	redirectUri: REDIRECT_URI,
	scopes: "openid profile email",
	buttonLabel: "Single sign-on",
	allowLocalLogin: true,
	requireVerifiedEmail: true,
	autoProvision: false,
	defaultRole: "user",
	allowInsecureIssuer: false,
	...overrides,
});

const setup = (options?: {
	clientHost?: string;
	oidcConfig?: OidcConfig | null;
	ssoOverrides?: Record<string, unknown>;
	userOverrides?: Record<string, unknown>;
}) => {
	const ssoService = {
		getPublicConfig: jest.fn().mockReturnValue({ enabled: true, label: "Single sign-on", localLoginDisabled: false }),
		buildAuthorizationRequest: jest
			.fn()
			.mockResolvedValue({ authorizationUrl: "https://auth.example.com/authorize?x=1", flowToken: "flow-token-123" }),
		exchangeCallback: jest.fn().mockResolvedValue({
			issuer: "https://auth.example.com/",
			subject: "subject-1",
			email: "ada@example.com",
			firstName: "Ada",
			lastName: "Lovelace",
		}),
		...options?.ssoOverrides,
	};
	const userService = {
		loginWithSso: jest.fn().mockResolvedValue({ user: { id: "user-1" }, token: "session-token-123" }),
		...options?.userOverrides,
	};
	const settingsService = {
		getOidcConfig: jest.fn().mockReturnValue(options?.oidcConfig === undefined ? makeOidcConfig() : options.oidcConfig),
		getSettings: jest.fn().mockReturnValue({ clientHost: options?.clientHost ?? "https://checkmate.example.com" }),
	};
	const controller = new SsoController(ssoService as never, userService as never, settingsService as never);
	const res = {
		json: jest.fn(),
		cookie: jest.fn(),
		clearCookie: jest.fn(),
		redirect: jest.fn(),
	} as unknown as Response;
	const next = jest.fn() as unknown as NextFunction;
	return { controller, ssoService, userService, settingsService, res, next };
};

const makeRequest = (overrides?: Partial<Request>): Request =>
	({
		hostname: "checkmate.example.com",
		originalUrl: "/api/v1/auth/sso/callback?code=abc&state=state-123",
		cookies: { checkmate_sso_flow: "flow-token-123" },
		...overrides,
	}) as unknown as Request;

const redirectTarget = (res: Response) => (res.redirect as jest.Mock).mock.calls[0]?.[0] as string;

// ── getSsoConfig ─────────────────────────────────────────────────────────────

describe("SsoController.getSsoConfig", () => {
	it("returns the public config in the standard envelope", async () => {
		const { controller, res, next } = setup();

		await controller.getSsoConfig(makeRequest(), res, next);

		expect(res.json).toHaveBeenCalledWith({
			success: true,
			msg: "ok",
			data: { enabled: true, label: "Single sign-on", localLoginDisabled: false },
		});
	});
});

// ── startSso ─────────────────────────────────────────────────────────────────

describe("SsoController.startSso", () => {
	it("sets the flow cookie and redirects to the provider", async () => {
		const { controller, res, next } = setup();

		await controller.startSso(makeRequest(), res, next);

		expect(res.cookie).toHaveBeenCalledWith(
			"checkmate_sso_flow",
			"flow-token-123",
			expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/api/v1/auth/sso", maxAge: 600000 })
		);
		expect(redirectTarget(res)).toBe("https://auth.example.com/authorize?x=1");
	});

	// trust proxy is not set, so req.secure is always false behind a TLS-terminating proxy.
	// Deriving the flag from configuration is what keeps the cookie marked Secure in production
	// without breaking a plain-http local install, where the browser would drop it.
	it("derives the Secure flag from the configured client host, not the request", async () => {
		const https = setup({ clientHost: "https://checkmate.example.com" });
		await https.controller.startSso(makeRequest(), https.res, https.next);
		expect((https.res.cookie as jest.Mock).mock.calls[0]?.[2]).toMatchObject({ secure: true });

		const http = setup({ clientHost: "http://localhost:5173" });
		await http.controller.startSso(makeRequest(), http.res, http.next);
		expect((http.res.cookie as jest.Mock).mock.calls[0]?.[2]).toMatchObject({ secure: false });
	});

	// Express does no virtual hosting, so a status page's custom domain answers this route too.
	// Without the guard the flow cookie would be planted on a tenant-controlled hostname.
	it("bounces to the canonical host before setting a cookie on another domain", async () => {
		const { controller, res, next } = setup();

		await controller.startSso(makeRequest({ hostname: "status.somecustomer.com" }), res, next);

		expect(res.cookie).not.toHaveBeenCalled();
		expect(redirectTarget(res)).toBe("https://checkmate.example.com/api/v1/auth/sso/start");
	});

	it("redirects to the login page with a code when sso is unavailable", async () => {
		const { controller, res, next } = setup({
			ssoOverrides: {
				buildAuthorizationRequest: jest.fn().mockRejectedValue(new AppError({ message: "nope", details: { code: "not_configured" } })),
			},
		});

		await controller.startSso(makeRequest(), res, next);

		expect(redirectTarget(res)).toBe("https://checkmate.example.com/login?sso_error=not_configured");
	});
});

// ── ssoCallback ──────────────────────────────────────────────────────────────

describe("SsoController.ssoCallback", () => {
	it("exchanges the callback and hands the session token over in the url fragment", async () => {
		const { controller, ssoService, userService, res, next } = setup();

		await controller.ssoCallback(makeRequest(), res, next);

		expect(ssoService.exchangeCallback).toHaveBeenCalledWith(new URL(REDIRECT_URI + "?code=abc&state=state-123"), "flow-token-123");
		expect(userService.loginWithSso).toHaveBeenCalled();
		expect(redirectTarget(res)).toBe("https://checkmate.example.com/auth/callback#token=session-token-123");
	});

	// A fragment is never sent to a server, so the token stays out of proxy logs and Referer headers.
	it("never puts the session token in a query string", async () => {
		const { controller, res, next } = setup();

		await controller.ssoCallback(makeRequest(), res, next);

		const target = redirectTarget(res);
		expect(new URL(target).search).toBe("");
		expect(target).toContain("#token=");
	});

	// sanitizeQuery runs DOMPurify over every query value, so req.query can no longer be trusted
	// to hold the code the provider actually sent.
	it("reads the code and state from the raw url rather than the sanitised query", async () => {
		const { controller, ssoService, res, next } = setup();

		// Percent-encoded exactly as a provider would send it; DOMPurify would rewrite the decoded form.
		await controller.ssoCallback(
			makeRequest({ originalUrl: "/api/v1/auth/sso/callback?code=a%3Cb%26c&state=s", query: { code: "scrubbed" } }),
			res,
			next
		);

		const [url] = (ssoService.exchangeCallback as jest.Mock).mock.calls[0] as [URL];
		expect(url.searchParams.get("code")).toBe("a<b&c");
		expect(url.searchParams.get("state")).toBe("s");
	});

	it("clears the flow cookie on success and on failure", async () => {
		const ok = setup();
		await ok.controller.ssoCallback(makeRequest(), ok.res, ok.next);
		expect(ok.res.clearCookie).toHaveBeenCalledWith("checkmate_sso_flow", { path: "/api/v1/auth/sso" });

		const failed = setup({
			ssoOverrides: { exchangeCallback: jest.fn().mockRejectedValue(new AppError({ message: "x", details: { code: "invalid_state" } })) },
		});
		await failed.controller.ssoCallback(makeRequest(), failed.res, failed.next);
		expect(failed.res.clearCookie).toHaveBeenCalledWith("checkmate_sso_flow", { path: "/api/v1/auth/sso" });
	});

	it("maps a resolution failure to its error code on the login page", async () => {
		const { controller, res, next } = setup({
			userOverrides: {
				loginWithSso: jest.fn().mockRejectedValue(new AppError({ message: "no account", details: { code: "not_invited" } })),
			},
		});

		await controller.ssoCallback(makeRequest(), res, next);

		expect(redirectTarget(res)).toBe("https://checkmate.example.com/login?sso_error=not_invited");
	});

	// The provider controls error_description, and an unrecognised AppError could carry anything.
	it("never reflects an unknown error message into the redirect", async () => {
		const { controller, res, next } = setup({
			ssoOverrides: {
				exchangeCallback: jest.fn().mockRejectedValue(new Error("<script>alert(1)</script> upstream said no")),
			},
		});

		await controller.ssoCallback(makeRequest(), res, next);

		expect(redirectTarget(res)).toBe("https://checkmate.example.com/login?sso_error=exchange_failed");
	});

	it("does not pass an arbitrary details.code through as an error code", async () => {
		const { controller, res, next } = setup({
			ssoOverrides: {
				exchangeCallback: jest.fn().mockRejectedValue(new AppError({ message: "x", details: { code: "../../evil" } })),
			},
		});

		await controller.ssoCallback(makeRequest(), res, next);

		expect(redirectTarget(res)).toBe("https://checkmate.example.com/login?sso_error=exchange_failed");
	});

	it("tolerates a client host configured with a trailing slash", async () => {
		const { controller, res, next } = setup({ clientHost: "https://checkmate.example.com/" });

		await controller.ssoCallback(makeRequest(), res, next);

		expect(redirectTarget(res)).toBe("https://checkmate.example.com/auth/callback#token=session-token-123");
	});
});
