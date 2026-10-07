import { RequestHandler } from "express";
import { AppError } from "@/utils/AppError.js";
import { Handler } from "@/api/controllers/controllerUtils.js";
import type { ISsoService } from "@/service/sso/ssoService.js";
import type { IUserService } from "@/domain/users/user.service.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { SsoErrorCodes, type SsoErrorCode } from "@/types/sso.js";

const FLOW_COOKIE_NAME = "checkmate_sso_flow";
// Scoped to the SSO routes so the cookie is not attached to every other API call.
const FLOW_COOKIE_PATH = "/api/v1/auth/sso";
const FLOW_COOKIE_MAX_AGE_MS = 600_000;

const isSsoErrorCode = (value: unknown): value is SsoErrorCode => SsoErrorCodes.includes(value as SsoErrorCode);

export interface ISsoController {
	getSsoConfig: RequestHandler;
	startSso: RequestHandler;
	ssoCallback: RequestHandler;
}

class SsoController implements ISsoController {
	private ssoService: ISsoService;
	private userService: IUserService;
	private settingsService: ISettingsService;

	constructor(ssoService: ISsoService, userService: IUserService, settingsService: ISettingsService) {
		this.ssoService = ssoService;
		this.userService = userService;
		this.settingsService = settingsService;
	}

	getSsoConfig: Handler = async (req, res) => {
		res.json({ success: true, msg: "ok", data: this.ssoService.getPublicConfig() });
	};

	// Redirects rather than returning the envelope: the browser is mid-navigation, so a JSON error
	// body would be rendered as text. Every failure lands back on the login page with a code.
	startSso: Handler = async (req, res) => {
		try {
			const canonical = this.canonicalOrigin();
			if (canonical && req.hostname !== new URL(canonical).hostname) {
				// Otherwise the flow cookie would be set on whatever host answered, including a
				// status page's custom domain, since Express does not do virtual hosting.
				res.redirect(`${canonical}${FLOW_COOKIE_PATH}/start`);
				return;
			}

			const { authorizationUrl, flowToken } = await this.ssoService.buildAuthorizationRequest();
			res.cookie(FLOW_COOKIE_NAME, flowToken, this.flowCookieOptions());
			res.redirect(authorizationUrl);
		} catch (error: unknown) {
			this.redirectWithError(res, error);
		}
	};

	ssoCallback: Handler = async (req, res) => {
		// Always cleared, on every branch: a stale cookie makes the user's next attempt fail.
		const clearCookie = () => res.clearCookie(FLOW_COOKIE_NAME, { path: FLOW_COOKIE_PATH });
		try {
			const callbackUrl = this.callbackUrl(req.originalUrl);
			const flowToken = (req.cookies as Record<string, string> | undefined)?.[FLOW_COOKIE_NAME];

			const claims = await this.ssoService.exchangeCallback(callbackUrl, flowToken);
			const { token } = await this.userService.loginWithSso(claims);

			clearCookie();
			// Fragment, not query: fragments are never sent to a server, so the token stays out of
			// reverse-proxy access logs and Referer headers. The callback page strips it on arrival.
			res.redirect(`${this.clientHost()}/auth/callback#token=${encodeURIComponent(token)}`);
		} catch (error: unknown) {
			clearCookie();
			this.redirectWithError(res, error);
		}
	};

	// Built from the configured redirect URI rather than the received path, because openid-client
	// derives the token request's redirect_uri from this URL and the provider requires it to match
	// the authorization request exactly; behind a prefix-stripping proxy the two would differ.
	// The query is taken from the raw URL rather than req.query, because sanitizeQuery runs
	// DOMPurify over every query value and would rewrite an opaque authorization code.
	private callbackUrl = (originalUrl: string): URL => {
		const url = new URL(this.settingsService.getOidcConfig()?.redirectUri ?? "http://localhost");
		const queryStart = originalUrl.indexOf("?");
		url.search = queryStart === -1 ? "" : originalUrl.slice(queryStart + 1);
		return url;
	};

	private canonicalOrigin = (): string => {
		const oidc = this.settingsService.getOidcConfig();
		if (!oidc?.redirectUri) return "";
		try {
			return new URL(oidc.redirectUri).origin;
		} catch {
			return "";
		}
	};

	private clientHost = (): string => this.settingsService.getSettings().clientHost.replace(/\/$/, "");

	private flowCookieOptions = () => ({
		httpOnly: true,
		// Not "strict": the provider returns the browser here as a cross-site top-level navigation,
		// and a strict cookie would not be sent with it.
		sameSite: "lax" as const,
		// Derived from configuration, never from the request: trust proxy is not set, so req.secure
		// is always false behind a TLS-terminating proxy and the cookie would be dropped.
		secure: this.clientHost().startsWith("https:"),
		path: FLOW_COOKIE_PATH,
		maxAge: FLOW_COOKIE_MAX_AGE_MS,
	});

	// Only ever sends a known code. A provider's own error text is attacker-influenced and stays in
	// the logs.
	private redirectWithError = (res: Parameters<Handler>[1], error: unknown) => {
		const code = error instanceof AppError && isSsoErrorCode(error.details?.code) ? error.details.code : "exchange_failed";
		res.redirect(`${this.clientHost()}/login?sso_error=${code}`);
	};
}

export default SsoController;
