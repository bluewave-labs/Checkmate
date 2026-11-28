import { describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { AuthStateService } from "../../../src/domain/users/auth-state.service.ts";
import { SsoSessionService } from "../../../src/domain/sso/sso-session.service.ts";
import { SsoLoginService } from "../../../src/domain/sso/sso-login.service.ts";
import type { ISsoLoginStateRepository } from "../../../src/domain/sso/sso-login-state.repository.interface.ts";
import type { ISsoSessionService } from "../../../src/domain/sso/sso-session.service.ts";
import type { IUsersRepository } from "../../../src/domain/users/user.repository.interface.ts";
import type { IAuthStateService } from "../../../src/domain/users/auth-state.service.ts";
import type { IConnectRepository } from "../../../src/domain/connect/connect.repository.interface.ts";
import { ConnectApiRejectedError, type IConnectApiService } from "../../../src/domain/connect/connect-api.service.ts";
import type { IEncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import type { ConnectSsoIdentity, ConnectState } from "../../../src/domain/connect/connect.type.ts";
import type { User } from "../../../src/domain/users/user.type.ts";
import { ssoErrors } from "../../../src/domain/sso/sso.errors.ts";
import { userErrors } from "../../../src/domain/users/user.errors.ts";
import { connectErrors } from "../../../src/domain/connect/connect.errors.ts";

const NOW_MS = 1_800_000_000_000;
const NOW_ISO = new Date(NOW_MS).toISOString();
const STATE = "s".repeat(43);

const makeIdentity = (overrides: Partial<ConnectSsoIdentity> = {}): ConnectSsoIdentity => ({
	provider: "entra",
	tenant: "tenant-1",
	subject: "sub-1",
	email: "Jane@Acme.com",
	firstName: "Jane",
	lastName: "Doe",
	role: "admin",
	roleManaged: true,
	...overrides,
});

const makeLink = (overrides: Partial<NonNullable<User["sso"]>> = {}): NonNullable<User["sso"]> => ({
	provider: "entra",
	tenant: "tenant-1",
	subject: "sub-1",
	roleManaged: true,
	lastCheckedAt: "2026-01-01T00:00:00.000Z",
	deactivatedBySso: false,
	...overrides,
});

const makeUser = (overrides: Partial<User> = {}): User =>
	({
		id: "user-1",
		firstName: "Old",
		lastName: "Name",
		email: "jane@acme.com",
		isActive: true,
		isVerified: true,
		role: ["user"],
		teamId: "team-1",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...overrides,
	}) as User;

const connectState = (overrides: Partial<ConnectState> = {}): ConnectState =>
	({
		enrollment: { connectUrl: "https://connect.example", agentId: "agent-1", token: "enc-token", apiUrl: null },
		sso: {
			enabled: true,
			provider: "entra",
			label: "Sign in with Microsoft",
			enforce: false,
			graceUntil: null,
			startUrl: "https://connect.example/sso/start",
			fetchedAt: NOW_ISO,
			lastCheckRunAt: null,
		},
		...overrides,
	}) as ConnectState;

type SetupOptions = {
	connect?: ConnectState;
	identity?: ConnectSsoIdentity;
	redeemError?: unknown;
	consumed?: { returnOrigin: string } | null;
	bySso?: User | null;
	byEmail?: User | null;
	isActive?: boolean;
	teamId?: string | null;
	linkResult?: null;
};

const setup = ({
	connect = connectState(),
	identity = makeIdentity(),
	redeemError,
	consumed = { returnOrigin: "https://app.example.com" },
	bySso = null,
	byEmail = null,
	isActive = true,
	teamId = "team-1",
	linkResult,
}: SetupOptions = {}) => {
	const calls: string[] = [];
	const stateRepository = {
		create: jest.fn<ISsoLoginStateRepository["create"]>().mockResolvedValue(undefined),
		consume: jest.fn<ISsoLoginStateRepository["consume"]>().mockResolvedValue(consumed),
	} as jest.Mocked<ISsoLoginStateRepository>;
	const usersRepository = {
		findBySsoIdentity: jest.fn<IUsersRepository["findBySsoIdentity"]>().mockResolvedValue(bySso),
		findByEmailOrNull: jest.fn<IUsersRepository["findByEmailOrNull"]>().mockResolvedValue(byEmail),
		findAuthState: jest.fn<IUsersRepository["findAuthState"]>().mockResolvedValue({ isActive, tokensValidAfter: null }),
		findSuperadminTeamId: jest.fn<IUsersRepository["findSuperadminTeamId"]>().mockResolvedValue(teamId),
		linkSso: jest.fn<IUsersRepository["linkSso"]>().mockImplementation(async (id, patch) => {
			calls.push("linkSso");
			if (linkResult === null) return null;
			return { ...makeUser({ id }), ...patch } as never;
		}),
		updateFromSso: jest.fn<IUsersRepository["updateFromSso"]>().mockImplementation(async (id, patch) => {
			calls.push("updateFromSso");
			return { ...makeUser({ id }), ...patch } as never;
		}),
		create: jest.fn<IUsersRepository["create"]>().mockImplementation(async (user) => ({ ...makeUser(), ...user, id: "user-new" }) as never),
	} as unknown as jest.Mocked<IUsersRepository>;
	const connectRepository = { get: jest.fn<IConnectRepository["get"]>().mockResolvedValue(connect) } as unknown as jest.Mocked<IConnectRepository>;
	const connectApiService = {
		ssoRedeem: jest.fn<IConnectApiService["ssoRedeem"]>().mockImplementation(async () => {
			calls.push("ssoRedeem");
			if (redeemError) throw redeemError;
			return identity;
		}),
	} as unknown as jest.Mocked<IConnectApiService>;
	const encryptionService = { decrypt: jest.fn((value: string) => `plain-${value}`) } as unknown as jest.Mocked<IEncryptionService>;
	const authStateService = {
		isTokenCurrent: jest.fn<IAuthStateService["isTokenCurrent"]>(),
		revokeTokens: jest.fn<IAuthStateService["revokeTokens"]>().mockImplementation(async () => {
			calls.push("revokeTokens");
		}),
	} as jest.Mocked<IAuthStateService>;
	const ssoSessionService = {
		startSession: jest.fn<ISsoSessionService["startSession"]>().mockImplementation(async () => {
			calls.push("startSession");
			return { token: "jwt", refreshToken: "refresh" };
		}),
	} as unknown as jest.Mocked<ISsoSessionService>;
	const service = new SsoLoginService(
		stateRepository,
		usersRepository,
		connectRepository,
		connectApiService,
		encryptionService,
		authStateService,
		ssoSessionService,
		() => NOW_MS
	);
	return { service, calls, stateRepository, usersRepository, connectRepository, connectApiService, authStateService, ssoSessionService };
};

describe("SsoLoginService", () => {
	describe("status", () => {
		it("reports enabled only when enrolled and Connect enables SSO", async () => {
			expect((await setup().service.status()).enabled).toBe(true);
			expect((await setup({ connect: connectState({ enrollment: null }) }).service.status()).enabled).toBe(false);
			expect((await setup({ connect: connectState({ sso: null }) }).service.status()).enabled).toBe(false);
		});
	});

	describe("start", () => {
		it.each(["https://app.example.com/path", "https://app.example.com/", "ftp://app.example.com", "not a url", "https://app.example.com:443"])(
			"start rejects an origin with a path, a trailing slash or a non-http scheme: %s",
			async (origin) => {
				const { service, stateRepository } = setup();
				await expect(service.start(origin)).rejects.toMatchObject({ definition: ssoErrors.invalidReturnOrigin });
				expect(stateRepository.create).not.toHaveBeenCalled();
			}
		);

		it("start refuses when SSO is disabled", async () => {
			const { service } = setup({ connect: connectState({ sso: null }) });
			await expect(service.start("https://app.example.com")).rejects.toMatchObject({ definition: ssoErrors.disabled });
		});

		it("start returns the Connect start URL with agent id, state and return", async () => {
			const { service, stateRepository } = setup();
			const { redirectUrl, state } = await service.start("https://app.example.com:8443");

			expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
			expect(redirectUrl).toBe(
				`https://connect.example/sso/start?agentId=agent-1&state=${state}&return=${encodeURIComponent("https://app.example.com:8443")}`
			);
			expect(stateRepository.create).toHaveBeenCalledWith(state, "https://app.example.com:8443", new Date(NOW_MS + 10 * 60 * 1000));
		});
	});

	describe("redeem", () => {
		it("redeem refuses a reused state without calling Connect", async () => {
			const { service, connectApiService } = setup({ consumed: null });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.stateInvalid });
			expect(connectApiService.ssoRedeem).not.toHaveBeenCalled();
		});

		it("redeem maps a 404 from Connect to codeInvalid and 403 to disabled", async () => {
			const notFound = setup({ redeemError: new ConnectApiRejectedError(404, "code_invalid") });
			await expect(notFound.service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.codeInvalid });
			const forbidden = setup({ redeemError: new ConnectApiRejectedError(403, "sso_disabled") });
			await expect(forbidden.service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.disabled });
		});

		it("redeem treats a 503 or a network failure as Connect being unreachable", async () => {
			for (const redeemError of [new ConnectApiRejectedError(503, "unavailable"), new Error("ECONNRESET")]) {
				const { service } = setup({ redeemError });
				await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: connectErrors.connectUnreachable });
			}
		});

		it("redeem sends the decrypted token to Connect", async () => {
			const { service, connectApiService } = setup({ bySso: makeUser({ sso: makeLink() }) });
			await service.redeem("code", STATE);
			expect(connectApiService.ssoRedeem).toHaveBeenCalledWith(expect.objectContaining({ agentId: "agent-1", token: "plain-enc-token" }), {
				code: "code",
				state: STATE,
			});
		});

		it("redeem signs in a linked user and applies a managed role", async () => {
			const { service, usersRepository, authStateService, ssoSessionService } = setup({
				bySso: makeUser({ sso: makeLink() }),
				identity: makeIdentity({ firstName: "Jane", lastName: "Smith", role: "admin" }),
			});
			const result = await service.redeem("code", STATE);

			expect(usersRepository.updateFromSso).toHaveBeenCalledWith("user-1", {
				firstName: "Jane",
				lastName: "Smith",
				email: "jane@acme.com",
				role: "admin",
				sso: makeLink({ lastCheckedAt: NOW_ISO }),
			});
			expect(authStateService.revokeTokens).not.toHaveBeenCalled();
			expect(ssoSessionService.startSession).toHaveBeenCalled();
			expect(result).toMatchObject({ token: "jwt", refreshToken: "refresh" });
		});

		it("redeem leaves the role alone when it is not managed", async () => {
			const { service, usersRepository } = setup({
				bySso: makeUser({ sso: makeLink({ roleManaged: false }) }),
				identity: makeIdentity({ roleManaged: false }),
			});
			await service.redeem("code", STATE);
			expect(usersRepository.updateFromSso.mock.calls[0][1].role).toBeUndefined();
		});

		it("redeem keeps the old email when the new one belongs to someone else", async () => {
			const { service, usersRepository } = setup({
				bySso: makeUser({ email: "old@acme.com", sso: makeLink() }),
				byEmail: makeUser({ id: "user-2", email: "jane@acme.com" }),
			});
			await service.redeem("code", STATE);
			expect(usersRepository.updateFromSso.mock.calls[0][1]).not.toHaveProperty("email");
		});

		it("redeem refuses a linked superadmin or demo user", async () => {
			for (const role of ["superadmin", "demo"] as const) {
				const { service, ssoSessionService } = setup({ bySso: makeUser({ role: [role], sso: makeLink() }) });
				await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.superadminNotAllowed });
				expect(ssoSessionService.startSession).not.toHaveBeenCalled();
			}
		});

		it("redeem reactivates a user deactivated by the SSO check", async () => {
			const { service, usersRepository } = setup({
				bySso: makeUser({ isActive: false, sso: makeLink({ deactivatedBySso: true }) }),
				isActive: false,
			});
			await service.redeem("code", STATE);
			const patch = usersRepository.updateFromSso.mock.calls[0][1];
			expect(patch.isActive).toBe(true);
			expect(patch.sso.deactivatedBySso).toBe(false);
		});

		it("redeem keeps a user deactivated by an admin out", async () => {
			const { service, usersRepository, ssoSessionService } = setup({ bySso: makeUser({ isActive: false, sso: makeLink() }), isActive: false });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: userErrors.accountInactive });
			expect(usersRepository.updateFromSso).not.toHaveBeenCalled();
			expect(ssoSessionService.startSession).not.toHaveBeenCalled();
		});

		it("redeem signs in a linked user whose document lacks isActive", async () => {
			// toEntity maps a missing isActive to false, findAuthState maps it to active; the service must trust findAuthState
			const { service } = setup({ bySso: makeUser({ isActive: false, sso: makeLink() }), isActive: true });
			await expect(service.redeem("code", STATE)).resolves.toBeDefined();
		});

		it("redeem links an existing user by email and revokes their old tokens before starting the session", async () => {
			const { service, calls, usersRepository, authStateService } = setup({ byEmail: makeUser({ role: ["user"] }) });
			await service.redeem("code", STATE);

			expect(usersRepository.findByEmailOrNull).toHaveBeenCalledWith("jane@acme.com");
			expect(usersRepository.linkSso).toHaveBeenCalledWith("user-1", {
				firstName: "Old",
				lastName: "Name",
				role: "admin",
				sso: makeLink({ lastCheckedAt: NOW_ISO }),
			});
			expect(authStateService.revokeTokens).toHaveBeenCalledWith(["user-1"]);
			expect(calls).toEqual(["ssoRedeem", "linkSso", "revokeTokens", "startSession"]);
		});

		it("redeem refuses the superadmin's email", async () => {
			const { service, usersRepository, ssoSessionService } = setup({ byEmail: makeUser({ role: ["superadmin"] }) });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.superadminNotAllowed });
			expect(usersRepository.updateFromSso).not.toHaveBeenCalled();
			expect(ssoSessionService.startSession).not.toHaveBeenCalled();
		});

		it("redeem never overwrites an existing link on an email match", async () => {
			const { service, usersRepository } = setup({ byEmail: makeUser({ sso: makeLink({ subject: "someone-else" }) }) });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.accountConflict });
			expect(usersRepository.updateFromSso).not.toHaveBeenCalled();
		});

		it("redeem maps a lost linking race to accountConflict and starts no session", async () => {
			const { service, authStateService, ssoSessionService } = setup({ byEmail: makeUser(), linkResult: null });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.accountConflict });
			expect(authStateService.revokeTokens).not.toHaveBeenCalled();
			expect(ssoSessionService.startSession).not.toHaveBeenCalled();
		});

		it("redeem accepts a session token issued in the same second as the revocation", async () => {
			let tokensValidAfter: number | null = null;
			const fakeUsers = {
				findAuthState: async () => ({ isActive: true, tokensValidAfter }),
				setTokensValidAfter: async (_ids: string[], seconds: number) => {
					tokensValidAfter = seconds;
				},
			} as unknown as IUsersRepository;
			const real = new AuthStateService(fakeUsers, () => NOW_MS);
			const { service, authStateService, ssoSessionService } = setup({ byEmail: makeUser() });
			authStateService.revokeTokens.mockImplementation(real.revokeTokens);
			ssoSessionService.startSession.mockImplementation(async (user) => {
				const { token } = await new SsoSessionService(
					{ create: async (input: object) => input } as never,
					fakeUsers,
					{ getSettings: () => ({ jwtSecret: "secret" }) } as never,
					() => NOW_MS
				).startSession(user);
				return { token, refreshToken: "refresh" };
			});

			// jsonwebtoken stamps iat from Date.now, so pin it to the same second as the revocation
			jest.useFakeTimers({ now: NOW_MS });
			try {
				const { token } = await service.redeem("code", STATE);
				const iat = (jwt.decode(token) as jwt.JwtPayload).iat;
				expect(iat).toBe(Math.floor(NOW_MS / 1000));
				expect(await real.isTokenCurrent("user-1", iat)).toBe(true);
				expect(await real.isTokenCurrent("user-1", iat! - 1)).toBe(false);
			} finally {
				jest.useRealTimers();
			}
		});

		it("redeem refuses an email match that an admin deactivated", async () => {
			const { service, usersRepository } = setup({ byEmail: makeUser({ isActive: false }), isActive: false });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: userErrors.accountInactive });
			expect(usersRepository.updateFromSso).not.toHaveBeenCalled();
		});

		it("redeem creates a new user in the superadmin's team without a password", async () => {
			const { service, usersRepository, authStateService, ssoSessionService } = setup();
			await service.redeem("code", STATE);

			const created = usersRepository.create.mock.calls[0][0];
			expect(created).toEqual({
				firstName: "Jane",
				lastName: "Doe",
				email: "jane@acme.com",
				teamId: "team-1",
				role: ["admin"],
				isVerified: true,
				sso: makeLink({ lastCheckedAt: NOW_ISO }),
			});
			expect(created).not.toHaveProperty("password");
			expect(authStateService.revokeTokens).not.toHaveBeenCalled();
			expect(ssoSessionService.startSession).toHaveBeenCalledWith(expect.objectContaining({ id: "user-new" }));
		});

		it("redeem refuses a new user when the instance has no superadmin yet", async () => {
			const { service, usersRepository } = setup({ teamId: null });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.notSetUp });
			expect(usersRepository.create).not.toHaveBeenCalled();
		});

		it("redeem refuses when SSO has been switched off since the link was started", async () => {
			const { service, connectApiService } = setup({ connect: connectState({ sso: null }) });
			await expect(service.redeem("code", STATE)).rejects.toMatchObject({ definition: ssoErrors.disabled });
			expect(connectApiService.ssoRedeem).not.toHaveBeenCalled();
		});
	});
});
