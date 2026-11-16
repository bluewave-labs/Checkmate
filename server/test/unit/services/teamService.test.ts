import { describe, expect, it, jest } from "@jest/globals";
import { TeamService } from "../../../src/domain/teams/team.service.ts";
import { teamErrors } from "../../../src/domain/teams/team.errors.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import type { ITeamsRepository } from "../../../src/domain/teams/team.repository.interface.ts";
import type { IEncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import type { ILogger } from "../../../src/utils/logger/logger.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const setup = (opts?: { hasKey?: boolean; setError?: Error }) => {
	const logger = createMockLogger();
	const teamsRepository = {
		hasHeartbeatKey: jest.fn<any>().mockResolvedValue(opts?.hasKey ?? false),
		setHeartbeatKey: opts?.setError ? jest.fn<any>().mockRejectedValue(opts.setError) : jest.fn<any>().mockResolvedValue(undefined),
	} as unknown as jest.Mocked<ITeamsRepository>;
	const encryptionService = {
		getRandomToken: jest.fn<any>().mockReturnValueOnce("key-1").mockReturnValueOnce("key-2"),
		hash: jest.fn((value: string) => `hash(${value})`),
	} as unknown as jest.Mocked<IEncryptionService>;
	const service = new TeamService({ logger: logger as unknown as ILogger, teamsRepository, encryptionService });
	return { service, logger, teamsRepository, encryptionService };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("TeamService.getHeartbeatKeyStatus", () => {
	it("reports a team with a key", async () => {
		const { service, teamsRepository } = setup({ hasKey: true });

		await expect(service.getHeartbeatKeyStatus("team-1")).resolves.toEqual({ hasKey: true });
		expect(teamsRepository.hasHeartbeatKey).toHaveBeenCalledWith("team-1");
	});

	it("reports a team without a key", async () => {
		const { service } = setup({ hasKey: false });

		await expect(service.getHeartbeatKeyStatus("team-1")).resolves.toEqual({ hasKey: false });
	});
});

describe("TeamService.rotateHeartbeatKey", () => {
	it("stores the hash, not the key, with the rotating user, and returns the key", async () => {
		const { service, teamsRepository, encryptionService } = setup();

		const result = await service.rotateHeartbeatKey("team-1", "user-1");

		expect(encryptionService.getRandomToken).toHaveBeenCalledWith(24);
		expect(encryptionService.hash).toHaveBeenCalledWith("key-1");
		expect(teamsRepository.setHeartbeatKey).toHaveBeenCalledWith("team-1", "hash(key-1)", "user-1");
		expect(result).toEqual({ heartbeatKey: "key-1" });
	});

	it("returns a new key on each rotation", async () => {
		const { service } = setup();

		const first = await service.rotateHeartbeatKey("team-1", "user-1");
		const second = await service.rotateHeartbeatKey("team-1", "user-1");

		expect(first.heartbeatKey).not.toBe(second.heartbeatKey);
	});

	it("never logs the key", async () => {
		const { service, logger } = setup();

		await service.rotateHeartbeatKey("team-1", "user-1");

		expect(JSON.stringify(logger.info.mock.calls)).not.toContain("key-1");
	});

	it("propagates a missing team", async () => {
		const { service } = setup({ setError: new AppError(teamErrors.notFound) });

		await expect(service.rotateHeartbeatKey("missing", "user-1")).rejects.toMatchObject({ definition: teamErrors.notFound });
	});
});
