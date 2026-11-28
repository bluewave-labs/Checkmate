import { describe, expect, it, jest } from "@jest/globals";
import { AuthStateService } from "../../../src/domain/users/auth-state.service.ts";
import type { IUsersRepository } from "../../../src/domain/users/user.repository.interface.ts";

type AuthState = { isActive: boolean; tokensValidAfter: number | null } | null;

const setup = (state: AuthState = { isActive: true, tokensValidAfter: null }) => {
	let nowMs = 1_000_000_000_000;
	const usersRepository = {
		findAuthState: jest.fn<IUsersRepository["findAuthState"]>().mockResolvedValue(state),
		setTokensValidAfter: jest.fn<IUsersRepository["setTokensValidAfter"]>().mockResolvedValue(undefined),
	} as unknown as jest.Mocked<IUsersRepository>;
	const service = new AuthStateService(usersRepository, () => nowMs);
	return {
		service,
		usersRepository,
		advance: (ms: number) => {
			nowMs += ms;
		},
	};
};

describe("AuthStateService", () => {
	it("accepts a token when no revocation is set", async () => {
		const { service } = setup();
		await expect(service.isTokenCurrent("user-1", 100)).resolves.toBe(true);
	});

	it("rejects a token issued before tokensValidAfter", async () => {
		const { service } = setup({ isActive: true, tokensValidAfter: 200 });
		await expect(service.isTokenCurrent("user-1", 199)).resolves.toBe(false);
	});

	it("accepts a token issued in the same second as the revocation", async () => {
		const { service } = setup({ isActive: true, tokensValidAfter: 200 });
		await expect(service.isTokenCurrent("user-1", 200)).resolves.toBe(true);
	});

	it("rejects a token without iat once revoked", async () => {
		const { service } = setup({ isActive: true, tokensValidAfter: 200 });
		await expect(service.isTokenCurrent("user-1", undefined)).resolves.toBe(false);
	});

	it("rejects an inactive user", async () => {
		const { service } = setup({ isActive: false, tokensValidAfter: null });
		await expect(service.isTokenCurrent("user-1", 100)).resolves.toBe(false);
	});

	it("rejects a deleted user", async () => {
		const { service } = setup(null);
		await expect(service.isTokenCurrent("user-1", 100)).resolves.toBe(false);
	});

	it("serves repeat checks from the cache for 60 seconds", async () => {
		const { service, usersRepository, advance } = setup();
		await service.isTokenCurrent("user-1", 100);
		await service.isTokenCurrent("user-1", 100);
		expect(usersRepository.findAuthState).toHaveBeenCalledTimes(1);

		advance(61_000);
		await service.isTokenCurrent("user-1", 100);
		expect(usersRepository.findAuthState).toHaveBeenCalledTimes(2);
	});

	it("revokeTokens writes whole seconds and clears the cache", async () => {
		const { service, usersRepository } = setup();
		await service.isTokenCurrent("user-1", 100);

		await service.revokeTokens(["user-1", "user-2"]);

		expect(usersRepository.setTokensValidAfter).toHaveBeenCalledWith(["user-1", "user-2"], 1_000_000_000);
		await service.isTokenCurrent("user-1", 100);
		expect(usersRepository.findAuthState).toHaveBeenCalledTimes(2);
	});

	it("revokeTokens takes an explicit cutoff and clears the cache", async () => {
		const { service, usersRepository } = setup();
		await service.isTokenCurrent("user-1", 100);

		await service.revokeTokens(["user-1"], 1_000_000_001);

		expect(usersRepository.setTokensValidAfter).toHaveBeenCalledWith(["user-1"], 1_000_000_001);
		await service.isTokenCurrent("user-1", 100);
		expect(usersRepository.findAuthState).toHaveBeenCalledTimes(2);
	});
});
