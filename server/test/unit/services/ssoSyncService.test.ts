import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectApiRejectedError } from "../../../src/domain/connect/connect-api.service.ts";
import type { ConnectEnrollment, ConnectSsoCheckResult, ConnectSsoConfig, ConnectSsoState } from "../../../src/domain/connect/connect.type.ts";
import { AuthStateService } from "../../../src/domain/users/auth-state.service.ts";
import { SsoSyncService } from "../../../src/domain/sso/sso-sync.service.ts";
import type { User } from "../../../src/domain/users/user.type.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const TOKEN = `cmk_${"a".repeat(48)}`;
const NOW = new Date("2026-11-27T10:00:00.000Z");

const config: ConnectSsoConfig = {
	enabled: true,
	provider: "entra",
	label: "Sign in with Microsoft",
	enforce: false,
	graceUntil: null,
	startUrl: "https://connect.checkmate.so/sso/start",
};

const cached: ConnectSsoState = { ...config, fetchedAt: "2026-11-27T09:00:00.000Z", lastCheckRunAt: "2026-11-27T09:30:00.000Z" };

const makeUser = (n: number, overrides: Partial<User> = {}): User => ({
	id: `user-${n}`,
	firstName: "Ada",
	lastName: "Lovelace",
	email: `user${n}@acme.com`,
	isActive: true,
	isVerified: true,
	role: ["user"],
	teamId: "team-1",
	sso: { provider: "entra", tenant: "tenant-1", subject: `sub-${n}`, roleManaged: true, lastCheckedAt: null, deactivatedBySso: false },
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	...overrides,
});

const allowedFor = (user: User, overrides: Partial<ConnectSsoCheckResult> = {}): ConnectSsoCheckResult => ({
	provider: user.sso!.provider,
	tenant: user.sso!.tenant,
	subject: user.sso!.subject,
	status: "allowed",
	role: "user",
	roleManaged: true,
	...overrides,
});

const dueState: ConnectSsoState = { ...cached, lastCheckRunAt: "2026-11-27T08:30:00.000Z" };

const setup = async (
	opts: {
		enrolled?: boolean;
		sso?: ConnectSsoState;
		ssoConfig?: jest.Mock<any>;
		ssoCheck?: jest.Mock<any>;
		linked?: User[];
		unlinkedEmails?: string[];
		passwordUserIds?: string[];
	} = {}
) => {
	const logger = createMockLogger();
	const encryptionService = new EncryptionService([nodeCrypto.randomBytes(32)], createMockLogger(), nodeCrypto);
	const connectRepository = new InMemoryConnectRepository();
	if (opts.enrolled !== false) {
		const enrollment: ConnectEnrollment = {
			connectUrl: "wss://relay.checkmate.so/api/tunnel",
			agentId: "agent-1",
			token: encryptionService.encrypt(TOKEN),
			apiUrl: "https://connect.checkmate.so",
		};
		await connectRepository.setEnrollment(enrollment);
	}
	if (opts.sso) await connectRepository.setSsoState(opts.sso);
	const connectApiService = {
		ssoConfig: opts.ssoConfig ?? jest.fn<any>().mockResolvedValue(config),
		ssoCheck: opts.ssoCheck ?? jest.fn<any>().mockResolvedValue([]),
	};
	const usersRepository = {
		findSsoLinked: jest.fn<any>().mockResolvedValue(opts.linked ?? []),
		findUnlinkedPasswordUserEmails: jest.fn<any>().mockResolvedValue(opts.unlinkedEmails ?? []),
		applySsoCheck: jest.fn<any>().mockResolvedValue(undefined),
		findPasswordUserIdsExceptSuperadmin: jest.fn<any>().mockResolvedValue(opts.passwordUserIds ?? []),
	};
	const ssoSessionRepository = {
		revokeAllForUser: jest.fn<any>().mockResolvedValue(undefined),
		revokeAll: jest.fn<any>().mockResolvedValue(undefined),
	};
	const authStateService = { revokeTokens: jest.fn<any>().mockResolvedValue(undefined) };
	const service = new SsoSyncService({
		connectRepository,
		connectApiService: connectApiService as any,
		encryptionService,
		usersRepository: usersRepository as any,
		ssoSessionRepository: ssoSessionRepository as any,
		authStateService: authStateService as any,
		logger: logger as any,
		now: () => NOW,
	});
	return { service, connectRepository, connectApiService, usersRepository, ssoSessionRepository, authStateService, logger };
};

describe("SsoSyncService.handleJob", () => {
	it("stores the config from Connect", async () => {
		const { service, connectRepository, connectApiService } = await setup({ sso: cached });

		await service.handleJob();

		expect(connectApiService.ssoConfig).toHaveBeenCalledWith(expect.objectContaining({ agentId: "agent-1", token: TOKEN }));
		expect((await connectRepository.get()).sso).toEqual({ ...config, fetchedAt: NOW.toISOString(), lastCheckRunAt: cached.lastCheckRunAt });
	});

	it("stores a null lastCheckRunAt on the first sync", async () => {
		const { service, connectRepository } = await setup({ ssoCheck: jest.fn<any>().mockRejectedValue(new Error("down")) });

		await service.handleJob();

		expect((await connectRepository.get()).sso).toMatchObject({ enabled: true, lastCheckRunAt: null });
	});

	it("keeps the cached config when Connect is unreachable", async () => {
		const { service, connectRepository } = await setup({ sso: cached, ssoConfig: jest.fn<any>().mockRejectedValue(new Error("ECONNREFUSED")) });

		await service.handleJob();

		expect((await connectRepository.get()).sso).toEqual(cached);
	});

	it("keeps the cached config when Connect answers 503 unavailable", async () => {
		const { service, connectRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockRejectedValue(new ConnectApiRejectedError(503, "unavailable")),
		});

		await service.handleJob();

		expect((await connectRepository.get()).sso).toEqual(cached);
	});

	it("stores a disabled config on 401", async () => {
		const { service, connectRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockRejectedValue(new ConnectApiRejectedError(401, "unauthorized")),
		});

		await service.handleJob();

		expect((await connectRepository.get()).sso).toEqual({
			enabled: false,
			provider: null,
			label: null,
			enforce: false,
			graceUntil: null,
			startUrl: null,
			fetchedAt: NOW.toISOString(),
			lastCheckRunAt: cached.lastCheckRunAt,
		});
	});

	it("clears the SSO state when the instance is not enrolled", async () => {
		const { service, connectRepository, connectApiService } = await setup({ enrolled: false, sso: cached });

		await service.handleJob();

		expect((await connectRepository.get()).sso).toBeNull();
		expect(connectApiService.ssoConfig).not.toHaveBeenCalled();
	});

	it("warns only when the outcome changes", async () => {
		const ssoConfig = jest.fn<any>().mockRejectedValue(new Error("down"));
		const { service, logger } = await setup({ ssoConfig });

		await service.handleJob();
		await service.handleJob();
		expect(logger.warn).toHaveBeenCalledTimes(1);

		ssoConfig.mockResolvedValue(config);
		await service.handleJob();
		await service.handleJob();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.info).toHaveBeenCalledTimes(1);
	});
});

describe("SsoSyncService offboarding check", () => {
	it("runs the check only when an hour has passed since the last run", async () => {
		const recent = await setup({ sso: cached });
		await recent.service.handleJob();
		expect(recent.connectApiService.ssoCheck).not.toHaveBeenCalled();

		const never = await setup();
		await never.service.handleJob();
		expect(never.connectApiService.ssoCheck).toHaveBeenCalledTimes(1);

		const due = await setup({ sso: dueState });
		await due.service.handleJob();
		expect(due.connectApiService.ssoCheck).toHaveBeenCalledTimes(1);
		expect((await due.connectRepository.get()).sso?.lastCheckRunAt).toBe(NOW.toISOString());
	});

	it("runs the check when lastCheckRunAt is in the future", async () => {
		const { service, connectApiService } = await setup({ sso: { ...cached, lastCheckRunAt: "2026-11-27T12:00:00.000Z" } });

		await service.handleJob();

		expect(connectApiService.ssoCheck).toHaveBeenCalledTimes(1);
	});

	it("does not run the check when SSO is disabled", async () => {
		const { service, connectApiService } = await setup({
			sso: dueState,
			ssoConfig: jest.fn<any>().mockResolvedValue({ ...config, enabled: false }),
		});

		await service.handleJob();

		expect(connectApiService.ssoCheck).not.toHaveBeenCalled();
	});

	it("sends unlinked password users once even with no linked users", async () => {
		const { service, connectApiService, usersRepository } = await setup({ unlinkedEmails: ["contractor@acme.com"] });

		await service.handleJob();

		expect(usersRepository.findUnlinkedPasswordUserEmails).toHaveBeenCalledWith(500);
		expect(connectApiService.ssoCheck).toHaveBeenCalledTimes(1);
		expect(connectApiService.ssoCheck).toHaveBeenCalledWith(expect.objectContaining({ agentId: "agent-1", token: TOKEN }), {
			subjects: [],
			unlinkedPasswordUsers: ["contractor@acme.com"],
		});
	});

	it("deactivates and revokes a denied user", async () => {
		const user = makeUser(1);
		const calls: string[] = [];
		const ssoCheck = jest.fn<any>().mockResolvedValue([{ ...allowedFor(user), status: "denied", role: null }]);
		const { service, usersRepository, ssoSessionRepository, authStateService } = await setup({ linked: [user], ssoCheck });
		authStateService.revokeTokens.mockImplementation(async () => void calls.push("tokens"));
		ssoSessionRepository.revokeAllForUser.mockImplementation(async () => void calls.push("sessions"));
		usersRepository.applySsoCheck.mockImplementation(async () => void calls.push("deactivate"));

		await service.handleJob();

		expect(authStateService.revokeTokens).toHaveBeenCalledWith(["user-1"]);
		expect(ssoSessionRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
		expect(usersRepository.applySsoCheck).toHaveBeenCalledWith("user-1", { isActive: false, deactivatedBySso: true });
		expect(calls).toEqual(["tokens", "sessions", "deactivate"]);
	});

	it("leaves an already inactive user alone when denied", async () => {
		const user = makeUser(1, { isActive: false });
		const ssoCheck = jest.fn<any>().mockResolvedValue([{ ...allowedFor(user), status: "denied", role: null }]);
		const { service, usersRepository, authStateService } = await setup({ linked: [user], ssoCheck });

		await service.handleJob();

		expect(usersRepository.applySsoCheck).not.toHaveBeenCalled();
		expect(authStateService.revokeTokens).not.toHaveBeenCalled();
	});

	it("marks an allowed user as checked", async () => {
		const user = makeUser(1);
		const ssoCheck = jest.fn<any>().mockResolvedValue([allowedFor(user)]);
		const { service, usersRepository, authStateService } = await setup({ linked: [user], ssoCheck });

		await service.handleJob();

		expect(usersRepository.applySsoCheck).toHaveBeenCalledWith("user-1", { lastCheckedAt: NOW.toISOString() });
		expect(authStateService.revokeTokens).not.toHaveBeenCalled();
	});

	it("updates a managed role", async () => {
		const user = makeUser(1);
		const ssoCheck = jest.fn<any>().mockResolvedValue([allowedFor(user, { role: "admin" })]);
		const { service, usersRepository } = await setup({ linked: [user], ssoCheck });

		await service.handleJob();

		expect(usersRepository.applySsoCheck).toHaveBeenCalledWith("user-1", { lastCheckedAt: NOW.toISOString(), role: "admin" });
	});

	it("revokes tokens on a managed demotion but not on a promotion", async () => {
		const admin = makeUser(1, { role: ["admin"] });
		const demote = await setup({ linked: [admin], ssoCheck: jest.fn<any>().mockResolvedValue([allowedFor(admin, { role: "user" })]) });
		await demote.service.handleJob();
		expect(demote.usersRepository.applySsoCheck).toHaveBeenCalledWith("user-1", { lastCheckedAt: NOW.toISOString(), role: "user" });
		expect(demote.authStateService.revokeTokens).toHaveBeenCalledWith(["user-1"]);

		const user = makeUser(2);
		const promote = await setup({ linked: [user], ssoCheck: jest.fn<any>().mockResolvedValue([allowedFor(user, { role: "admin" })]) });
		await promote.service.handleJob();
		expect(promote.authStateService.revokeTokens).not.toHaveBeenCalled();
	});

	it("keeps the role when Connect does not manage it", async () => {
		const user = makeUser(1);
		const ssoCheck = jest.fn<any>().mockResolvedValue([allowedFor(user, { role: "admin", roleManaged: false })]);
		const { service, usersRepository } = await setup({ linked: [user], ssoCheck });

		await service.handleJob();

		expect(usersRepository.applySsoCheck).toHaveBeenCalledWith("user-1", { lastCheckedAt: NOW.toISOString() });
	});

	it("leaves users untouched when Connect answers unknown", async () => {
		const user = makeUser(1);
		const ssoCheck = jest.fn<any>().mockResolvedValue([{ ...allowedFor(user), status: "unknown", role: null }]);
		const { service, usersRepository, authStateService, ssoSessionRepository } = await setup({ linked: [user], ssoCheck });

		await service.handleJob();

		expect(usersRepository.applySsoCheck).not.toHaveBeenCalled();
		expect(authStateService.revokeTokens).not.toHaveBeenCalled();
		expect(ssoSessionRepository.revokeAllForUser).not.toHaveBeenCalled();
	});

	it("ignores results that match no linked user", async () => {
		const user = makeUser(1);
		const stranger = makeUser(2);
		const ssoCheck = jest.fn<any>().mockResolvedValue([{ ...allowedFor(stranger), status: "denied", role: null }]);
		const { service, usersRepository } = await setup({ linked: [user], ssoCheck });

		await service.handleJob();

		expect(usersRepository.applySsoCheck).not.toHaveBeenCalled();
	});

	it("changes nobody and keeps lastCheckRunAt unset when Connect is unreachable", async () => {
		const user = makeUser(1);
		for (const failure of [
			new Error("ECONNREFUSED"),
			new ConnectApiRejectedError(503, "unavailable"),
			new ConnectApiRejectedError(401, "unauthorized"),
		]) {
			const { service, connectRepository, usersRepository, authStateService } = await setup({
				linked: [user],
				ssoCheck: jest.fn<any>().mockRejectedValue(failure),
			});

			await service.handleJob();

			expect(usersRepository.applySsoCheck).not.toHaveBeenCalled();
			expect(authStateService.revokeTokens).not.toHaveBeenCalled();
			expect((await connectRepository.get()).sso?.lastCheckRunAt).toBeNull();
		}
	});

	it("stops without changing users when Connect answers sso_disabled", async () => {
		const user = makeUser(1);
		const { service, connectRepository, usersRepository } = await setup({
			linked: [user],
			ssoCheck: jest.fn<any>().mockRejectedValue(new ConnectApiRejectedError(403, "sso_disabled")),
		});

		await service.handleJob();

		expect(usersRepository.applySsoCheck).not.toHaveBeenCalled();
		// The disabled config carries the run time, so a config that still reads enabled can't repeat the lapse every sync
		expect((await connectRepository.get()).sso).toMatchObject({ enabled: false, lastCheckRunAt: NOW.toISOString() });
	});

	it("splits 120 linked users into batches of 50, 50 and 20", async () => {
		const linked = Array.from({ length: 120 }, (_, i) => makeUser(i));
		const ssoCheck = jest
			.fn<any>()
			.mockImplementation(async (_enrollment: unknown, input: { subjects: { subject: string }[] }) =>
				input.subjects.map((s) => ({ ...allowedFor(linked.find((u) => u.sso!.subject === s.subject)!) }))
			);
		const { service, connectRepository, usersRepository } = await setup({ linked, ssoCheck, unlinkedEmails: ["a@acme.com"] });

		await service.handleJob();

		expect(ssoCheck.mock.calls.map((c: any) => c[1].subjects.length)).toEqual([50, 50, 20]);
		expect(ssoCheck.mock.calls.map((c: any) => "unlinkedPasswordUsers" in c[1])).toEqual([true, false, false]);
		expect(usersRepository.applySsoCheck).toHaveBeenCalledTimes(120);
		expect((await connectRepository.get()).sso?.lastCheckRunAt).toBe(NOW.toISOString());
	});

	it("keeps lastCheckRunAt unset when a later batch fails", async () => {
		const linked = Array.from({ length: 60 }, (_, i) => makeUser(i));
		const ssoCheck = jest
			.fn<any>()
			.mockResolvedValueOnce(linked.slice(0, 50).map((u) => allowedFor(u)))
			.mockRejectedValueOnce(new Error("down"));
		const { service, connectRepository } = await setup({ linked, ssoCheck });

		await service.handleJob();

		expect((await connectRepository.get()).sso?.lastCheckRunAt).toBeNull();
	});
});

describe("SsoSyncService enforcement", () => {
	const enforced: ConnectSsoConfig = { ...config, enforce: true };
	const disabled = { enabled: false, provider: null, label: null, enforce: false, graceUntil: null, startUrl: null };

	it("turning enforce on revokes password users once", async () => {
		const { service, authStateService, usersRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockResolvedValue(enforced),
			passwordUserIds: ["user-1", "user-2"],
		});

		await service.handleJob();
		await service.handleJob();

		expect(usersRepository.findPasswordUserIdsExceptSuperadmin).toHaveBeenCalledTimes(1);
		// Two passes in the transition (the second closes the same-second window), none on the later sync
		expect(authStateService.revokeTokens).toHaveBeenCalledTimes(2);
		expect(authStateService.revokeTokens).toHaveBeenNthCalledWith(1, ["user-1", "user-2"]);
	});

	it("the second enforce revocation uses a cutoff one second ahead, after the config is stored", async () => {
		const { service, authStateService, connectRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockResolvedValue(enforced),
			passwordUserIds: ["user-1"],
		});
		const enforceWhenCalled: unknown[] = [];
		authStateService.revokeTokens.mockImplementation(async () => void enforceWhenCalled.push((await connectRepository.get()).sso?.enforce));

		await service.handleJob();

		expect(authStateService.revokeTokens).toHaveBeenNthCalledWith(2, ["user-1"], Math.floor(NOW.getTime() / 1000) + 1);
		expect(enforceWhenCalled).toEqual([false, true]);
	});

	it("rejects a token issued in the transition second once the second revocation is in place", async () => {
		const nowSeconds = Math.floor(NOW.getTime() / 1000);
		let validAfter: number | null = null;
		const real = new AuthStateService(
			{
				findAuthState: async () => ({ isActive: true, tokensValidAfter: validAfter }),
				setTokensValidAfter: async (_ids: string[], seconds: number) => void (validAfter = seconds),
			} as any,
			() => NOW.getTime()
		);
		const { service, authStateService } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockResolvedValue(enforced),
			passwordUserIds: ["user-1"],
		});
		authStateService.revokeTokens.mockImplementation((ids: string[], cutoff?: number) => real.revokeTokens(ids, cutoff));

		await service.handleJob();

		await expect(real.isTokenCurrent("user-1", nowSeconds)).resolves.toBe(false);
		await expect(real.isTokenCurrent("user-1", nowSeconds + 1)).resolves.toBe(true);
	});

	it("revokes again when enforce goes off and on again", async () => {
		const ssoConfig = jest.fn<any>().mockResolvedValueOnce(enforced).mockResolvedValueOnce(config).mockResolvedValueOnce(enforced);
		const { service, authStateService } = await setup({ sso: cached, ssoConfig, passwordUserIds: ["user-1"] });

		await service.handleJob();
		await service.handleJob();
		await service.handleJob();

		expect(authStateService.revokeTokens).toHaveBeenCalledTimes(4);
	});

	it("does not revoke anyone when enforce stays off", async () => {
		const { service, authStateService } = await setup({ sso: cached });

		await service.handleJob();

		expect(authStateService.revokeTokens).not.toHaveBeenCalled();
	});

	it("retries the enforce revocation on the next sync when it fails", async () => {
		const { service, authStateService, connectRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockResolvedValue(enforced),
			passwordUserIds: ["user-1"],
		});
		authStateService.revokeTokens.mockRejectedValueOnce(new Error("db down"));

		await service.handleJob();
		expect((await connectRepository.get()).sso?.enforce).toBe(false);
		await service.handleJob();

		expect(authStateService.revokeTokens).toHaveBeenCalledTimes(3);
	});

	it("a lapse revokes all SSO sessions", async () => {
		const { service, ssoSessionRepository, connectRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockResolvedValue(disabled),
		});

		await service.handleJob();
		await service.handleJob();

		expect(ssoSessionRepository.revokeAll).toHaveBeenCalledTimes(1);
		expect((await connectRepository.get()).sso).toMatchObject({ enabled: false });
	});

	it("a lapse reported by the check revokes all SSO sessions and stores the disabled config", async () => {
		const { service, ssoSessionRepository, connectRepository } = await setup({
			sso: dueState,
			ssoCheck: jest.fn<any>().mockRejectedValue(new ConnectApiRejectedError(403, "sso_disabled")),
		});

		await service.handleJob();

		expect(ssoSessionRepository.revokeAll).toHaveBeenCalledTimes(1);
		expect((await connectRepository.get()).sso).toEqual({ ...disabled, fetchedAt: NOW.toISOString(), lastCheckRunAt: NOW.toISOString() });
	});

	it("does not revoke sessions for a config that was never enabled", async () => {
		const { service, ssoSessionRepository } = await setup({
			sso: { ...cached, ...disabled },
			ssoConfig: jest.fn<any>().mockResolvedValue(disabled),
		});

		await service.handleJob();

		expect(ssoSessionRepository.revokeAll).not.toHaveBeenCalled();
	});

	it("revokes all SSO sessions once when Connect rejects the credentials", async () => {
		const { service, ssoSessionRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockRejectedValue(new ConnectApiRejectedError(401, "unauthorized")),
		});

		await service.handleJob();
		await service.handleJob();

		expect(ssoSessionRepository.revokeAll).toHaveBeenCalledTimes(1);
	});
});
