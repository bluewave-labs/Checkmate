import { describe, expect, it, jest } from "@jest/globals";
import { StatusPageBruteForceService, MAX_ATTEMPTS, LOCKOUT_WINDOW_MS } from "../../../src/service/business/statusPageBruteForceService.ts";
import type { IStatusPageLockoutsRepository } from "../../../src/repositories/status-page-lockouts/IStatusPageLockoutsRepository.ts";

const createRepo = (): jest.Mocked<IStatusPageLockoutsRepository> => ({
	recordFailure: jest.fn(),
	getState: jest.fn(),
	clear: jest.fn(),
});

const setup = () => {
	const repo = createRepo();
	const service = new StatusPageBruteForceService(repo);
	return { repo, service };
};

describe("StatusPageBruteForceService", () => {
	it("isLockedOut returns false when attempts < MAX_ATTEMPTS", async () => {
		const { repo, service } = setup();
		repo.getState.mockResolvedValue({ attempts: MAX_ATTEMPTS - 1, lockedUntil: new Date(Date.now() + 1000) });
		expect(await service.isLockedOut("page", "ip")).toBe(false);
	});

	it("isLockedOut returns true when attempts >= MAX_ATTEMPTS and not expired", async () => {
		const { repo, service } = setup();
		repo.getState.mockResolvedValue({ attempts: MAX_ATTEMPTS, lockedUntil: new Date(Date.now() + 1000) });
		expect(await service.isLockedOut("page", "ip")).toBe(true);
	});

	it("isLockedOut returns false when attempts >= MAX_ATTEMPTS but lockedUntil has passed", async () => {
		const { repo, service } = setup();
		repo.getState.mockResolvedValue({ attempts: MAX_ATTEMPTS + 5, lockedUntil: new Date(Date.now() - 1000) });
		expect(await service.isLockedOut("page", "ip")).toBe(false);
	});

	it("recordFailure delegates to repo with LOCKOUT_WINDOW_MS", async () => {
		const { repo, service } = setup();
		repo.recordFailure.mockResolvedValue({ attempts: 1, lockedUntil: new Date() });
		await service.recordFailure("page", "ip");
		expect(repo.recordFailure).toHaveBeenCalledWith("page", "ip", LOCKOUT_WINDOW_MS);
	});

	it("clear delegates to repo", async () => {
		const { repo, service } = setup();
		await service.clear("page", "ip");
		expect(repo.clear).toHaveBeenCalledWith("page", "ip");
	});

	it("hashIp returns the same value for the same input and differs across inputs", () => {
		const { service } = setup();
		const a = service.hashIp("203.0.113.1");
		const b = service.hashIp("203.0.113.1");
		const c = service.hashIp("203.0.113.2");
		expect(a).toBe(b);
		expect(a).not.toBe(c);
		expect(a).toMatch(/^[a-f0-9]{64}$/);
	});
});
