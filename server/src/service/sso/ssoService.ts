import type * as openidClient from "openid-client";
import type jwt from "jsonwebtoken";
import { AppError } from "@/utils/AppError.js";
import type { ILogger } from "@/utils/logger.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { OidcConfig, SsoErrorCode } from "@/types/sso.js";

const SERVICE_NAME = "SsoService";

// Seconds. openid-client defaults to 30, which is long enough for a slow provider to hold a
// request open and pin sockets; a sign-in redirect should fail fast and be retried by the user.
const REQUEST_TIMEOUT_SECONDS = 5;

// The flow token only has to survive the round trip to the provider and back.
const FLOW_TOKEN_TTL_SECONDS = 600;
const FLOW_TOKEN_PURPOSE = "sso-flow";

type JwtType = typeof jwt;

// Injected rather than imported so the service is unit-testable without jest.unstable_mockModule,
// matching how crypto, jsonwebtoken and gamedig are already wired in config/services.api.ts.
export type OidcLib = Pick<
	typeof openidClient,
	| "discovery"
	| "buildAuthorizationUrl"
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
export type SsoPublicConfig = {
	enabled: boolean;
	label: string;
	localLoginDisabled: boolean;
};

type FlowTokenPayload = {
	purpose: typeof FLOW_TOKEN_PURPOSE;
	state: string;
	nonce: string;
	codeVerifier: string;
};

export interface ISsoService {
	getPublicConfig(): SsoPublicConfig;
	buildAuthorizationRequest(): Promise<SsoAuthorizationRequest>;
}

export class SsoService implements ISsoService {
	static SERVICE_NAME = SERVICE_NAME;

	private oidc: OidcLib;
	private settingsService: ISettingsService;
	private jwt: JwtType;
	private logger: ILogger;

	// Discovery is one network round trip per sign-in otherwise. The in-flight promise is cached,
	// not just the result, so concurrent sign-ins collapse to a single fetch. openid-client refreshes
	// the provider's keys inside the Configuration, so this does not go stale.
	private configuration: Promise<openidClient.Configuration> | null = null;

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

	private requireConfig = (method: string): OidcConfig => {
		const oidc = this.settingsService.getOidcConfig();
		if (!oidc) {
			throw this.fail(method, "not_configured", "Single sign-on is not configured");
		}
		return oidc;
	};

	private getConfiguration = (oidc: OidcConfig): Promise<openidClient.Configuration> => {
		const cached = this.configuration;
		if (cached) {
			return cached;
		}

		const pending = this.discover(oidc);
		this.configuration = pending;
		// A failed discovery must not be cached, or one provider outage disables sign-in until restart.
		pending.catch(() => {
			if (this.configuration === pending) {
				this.configuration = null;
			}
		});
		return pending;
	};

	private discover = async (oidc: OidcConfig): Promise<openidClient.Configuration> => {
		const configuration = await this.oidc.discovery(new URL(oidc.issuer), oidc.clientId, oidc.clientSecret);
		configuration.timeout = REQUEST_TIMEOUT_SECONDS;
		if (oidc.allowInsecureIssuer) {
			this.oidc.allowInsecureRequests(configuration);
		}
		return configuration;
	};

	// Signed with the application secret and handed to the browser as an httpOnly cookie. It carries no
	// id, teamId or role, so verifyJWT's payload guard rejects it if anyone presents it as a Bearer token.
	private signFlowToken = (payload: FlowTokenPayload): string => {
		const { jwtSecret } = this.settingsService.getSettings();
		return this.jwt.sign(payload, jwtSecret, { expiresIn: FLOW_TOKEN_TTL_SECONDS });
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
