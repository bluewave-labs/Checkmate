import { describe, expect, it, jest } from "@jest/globals";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { SsoSessionService } from "../../../src/domain/sso/sso-session.service.ts";
import type { ISsoSessionRepository } from "../../../src/domain/sso/sso-session.repository.interface.ts";
import type { SsoSession } from "../../../src/domain/sso/sso-session.type.ts";
import type { IUsersRepository } from "../../../src/domain/users/user.repository.interface.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import { userErrors } from "../../../src/domain/users/user.errors.ts";
import type { UserResponse } from "../../../src/domain/users/user.type.ts";

const NOW_MS = 1_800_000_000_000;
const NOW_S = Math.floor(NOW_MS / 1000);
const HOUR_MS = 60 * 60 * 1000;
const JWT_SECRET = "test-secret";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const makeUser = (overrides: Partial<UserResponse> = {}): UserResponse =>
	({
		id: "user-1",
		firstName: "Ada",
		lastName: "Lovelace",
		email: "ada@example.com",
		isActive: true,
		isVerified: true,
		role: ["user"],
		teamId: "team-1",
		sso: {
			provider: "entra",
			tenant: "tenant-1",
			subject: "sub-1",
			roleManaged: false,
			lastCheckedAt: new Date(NOW_MS - HOUR_MS).toISOString(),
			deactivatedBySso: false,
		},
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...overrides,
	}) as UserResponse;

type SetupOptions = {
	session?: Partial<SsoSession> | null;
	user?: UserResponse;
	authState?: { isActive: boolean; tokensValidAfter: number | null } | null;
};

const setup = ({ session = {}, user = makeUser(), authState = { isActive: true, tokensValidAfter: null } }: SetupOptions = {}) => {
	const stored: SsoSession | null =
		session === null
			? null
			: {
					id: "session-1",
					userId: "user-1",
					tokenHash: "old-hash",
					issuedAt: NOW_S - 60,
					absoluteExpiresAt: new Date(NOW_MS + 24 * HOUR_MS),
					revokedAt: null,
					...session,
				};
	const ssoSessionsRepository = {
		create: jest.fn<ISsoSessionRepository["create"]>().mockImplementation(async (input) => ({ id: "session-new", revokedAt: null, ...input })),
		findActiveByHash: jest.fn<ISsoSessionRepository["findActiveByHash"]>().mockResolvedValue(stored),
		rotate: jest.fn<ISsoSessionRepository["rotate"]>().mockResolvedValue(true),
		revoke: jest.fn<ISsoSessionRepository["revoke"]>().mockResolvedValue(undefined),
		revokeByHash: jest.fn<ISsoSessionRepository["revokeByHash"]>().mockResolvedValue(undefined),
		revokeAllForUser: jest.fn<ISsoSessionRepository["revokeAllForUser"]>().mockResolvedValue(undefined),
		revokeAll: jest.fn<ISsoSessionRepository["revokeAll"]>().mockResolvedValue(undefined),
	} as jest.Mocked<ISsoSessionRepository>;
	const usersRepository = {
		findById: jest.fn<IUsersRepository["findById"]>().mockResolvedValue(user),
		findAuthState: jest.fn<IUsersRepository["findAuthState"]>().mockResolvedValue(authState),
	} as unknown as jest.Mocked<IUsersRepository>;
	const settingsService = {
		getSettings: jest.fn().mockReturnValue({ jwtSecret: JWT_SECRET }),
	} as unknown as jest.Mocked<ISettingsService>;
	const service = new SsoSessionService(ssoSessionsRepository, usersRepository, settingsService, () => NOW_MS);
	return { service, ssoSessionsRepository, usersRepository };
};

describe("SsoSessionService", () => {
	it("startSession returns a 15 minute token and stores only the hash", async () => {
		const { service, ssoSessionsRepository } = setup();
		const { token, refreshToken } = await service.startSession(makeUser());

		const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
		expect(payload.id).toBe("user-1");
		expect(payload.avatarImage).toBe("");
		expect(payload.exp! - payload.iat!).toBe(15 * 60);

		const input = ssoSessionsRepository.create.mock.calls[0][0];
		expect(input.tokenHash).toBe(sha256(refreshToken));
		expect(input.tokenHash).not.toBe(refreshToken);
		expect(input.userId).toBe("user-1");
		expect(input.absoluteExpiresAt.getTime()).toBe(NOW_MS + 30 * 24 * HOUR_MS);
	});

	it("refresh rotates the refresh token and returns the current user", async () => {
		const fresh = makeUser({ role: ["admin"] });
		const { service, ssoSessionsRepository } = setup({ user: fresh });
		const result = await service.refresh("old-token");

		expect(ssoSessionsRepository.findActiveByHash).toHaveBeenCalledWith(sha256("old-token"), new Date(NOW_MS));
		expect(result.user.role).toEqual(["admin"]);
		expect(result.refreshToken).not.toBe("old-token");
		expect(ssoSessionsRepository.rotate).toHaveBeenCalledWith("session-1", "old-hash", sha256(result.refreshToken), NOW_S, new Date(NOW_MS));
		expect((jwt.verify(result.token, JWT_SECRET) as jwt.JwtPayload).role).toEqual(["admin"]);
	});

	it("refresh rejects a revoked session", async () => {
		const { service, ssoSessionsRepository } = setup({ session: null });
		await expect(service.refresh("gone")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.rotate).not.toHaveBeenCalled();
		expect(ssoSessionsRepository.revoke).not.toHaveBeenCalled();
	});

	it("refresh rejects a session issued before tokensValidAfter and revokes it", async () => {
		const { service, ssoSessionsRepository } = setup({
			session: { issuedAt: NOW_S - 100 },
			authState: { isActive: true, tokensValidAfter: NOW_S - 50 },
		});
		await expect(service.refresh("old-token")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.revoke).toHaveBeenCalledWith("session-1");
		expect(ssoSessionsRepository.rotate).not.toHaveBeenCalled();
	});

	it("refresh accepts a session issued in the same second as tokensValidAfter", async () => {
		const { service, ssoSessionsRepository } = setup({
			session: { issuedAt: NOW_S - 50 },
			authState: { isActive: true, tokensValidAfter: NOW_S - 50 },
		});
		await expect(service.refresh("old-token")).resolves.toBeDefined();
		expect(ssoSessionsRepository.revoke).not.toHaveBeenCalled();
	});

	it("refresh rejects when the last check is older than 24 hours", async () => {
		const stale = makeUser();
		stale.sso!.lastCheckedAt = new Date(NOW_MS - 25 * HOUR_MS).toISOString();
		const { service, ssoSessionsRepository } = setup({ user: stale });
		await expect(service.refresh("old-token")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.revoke).toHaveBeenCalledWith("session-1");
	});

	it("refresh rejects when the link was never checked", async () => {
		const unchecked = makeUser();
		unchecked.sso!.lastCheckedAt = null;
		const { service, ssoSessionsRepository } = setup({ user: unchecked });
		await expect(service.refresh("old-token")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.revoke).toHaveBeenCalledWith("session-1");
	});

	it("refresh rejects a user that no longer exists and revokes the session", async () => {
		const { service, ssoSessionsRepository, usersRepository } = setup();
		usersRepository.findById.mockRejectedValueOnce(new AppError(userErrors.notFound));
		await expect(service.refresh("old-token")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.revoke).toHaveBeenCalledWith("session-1");
	});

	it("refresh keeps the session when loading the user fails unexpectedly", async () => {
		const { service, ssoSessionsRepository, usersRepository } = setup();
		usersRepository.findById.mockRejectedValueOnce(new Error("db down"));
		await expect(service.refresh("old-token")).rejects.toThrow("db down");
		expect(ssoSessionsRepository.revoke).not.toHaveBeenCalled();
		expect(ssoSessionsRepository.rotate).not.toHaveBeenCalled();
	});

	it("refresh rejects when the token was rotated concurrently", async () => {
		const { service, ssoSessionsRepository } = setup();
		ssoSessionsRepository.rotate.mockResolvedValueOnce(false);
		await expect(service.refresh("old-token")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.revoke).not.toHaveBeenCalled();
	});

	it("refresh rejects an inactive user", async () => {
		const { service, ssoSessionsRepository } = setup({ authState: { isActive: false, tokensValidAfter: null } });
		await expect(service.refresh("old-token")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.revoke).toHaveBeenCalledWith("session-1");
	});

	it("refresh rejects a user no longer linked to SSO", async () => {
		const { service, ssoSessionsRepository } = setup({ user: makeUser({ sso: undefined }) });
		await expect(service.refresh("old-token")).rejects.toMatchObject({ status: 401 });
		expect(ssoSessionsRepository.revoke).toHaveBeenCalledWith("session-1");
	});

	it("logout ignores an unknown token", async () => {
		const { service, ssoSessionsRepository } = setup({ session: null });
		ssoSessionsRepository.revokeByHash.mockRejectedValueOnce(new Error("db down"));
		await expect(service.logout("unknown")).resolves.toBeUndefined();
		expect(ssoSessionsRepository.revokeByHash).toHaveBeenCalledWith(sha256("unknown"));
	});
});
