import { describe, expect, it, jest } from "@jest/globals";
import { DockerLogsService } from "../../../src/domain/docker/docker-log.service.ts";
import { DOCKER_LOG_TAIL_LINES, type DockerLogLine } from "../../../src/domain/docker/docker.type.ts";
import type { MonitorStatusResponse, DockerStatusPayload } from "../../../src/types/network.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const line = (second: number): DockerLogLine => ({
	ts: `2026-01-01T00:00:${String(second).padStart(2, "0")}.000000000Z`,
	stream: "stdout",
	text: `line ${second}`,
});

const status = (logs?: DockerStatusPayload["logs"]): MonitorStatusResponse<DockerStatusPayload> => ({
	monitorId: "monitor-1",
	teamId: "team-1",
	type: "docker",
	status: true,
	code: 200,
	message: "OK",
	payload: { containers: [], summary: { total: 0, running: 0, stopped: 0, unhealthy: 0 }, logs },
});

const createService = () => {
	const repository = {
		findLastLineTimestamp: jest.fn().mockResolvedValue(null),
		createDockerLogs: jest.fn().mockResolvedValue(0),
	};
	const logger = createMockLogger();
	return { service: new DockerLogsService({ logger: logger as any, dockerLogsRepository: repository as any }), repository, logger };
};

describe("DockerLogsService", () => {
	it("returns no documents for missing or empty logs", async () => {
		const { service, repository } = createService();
		expect(await service.buildDockerLogs(status())).toEqual([]);
		expect(await service.buildDockerLogs(status([]))).toEqual([]);
		expect(repository.findLastLineTimestamp).not.toHaveBeenCalled();
	});

	it("seeds the cursor, drops old lines, and sets seven-day expiry", async () => {
		const { service, repository } = createService();
		repository.findLastLineTimestamp.mockResolvedValue(line(1).ts);

		const result = await service.buildDockerLogs(status([{ containerId: "container-1", containerName: "web", lines: [line(1), line(2)] }]));

		expect(repository.findLastLineTimestamp).toHaveBeenCalledWith("monitor-1", "container-1");
		expect(result[0]?.lines).toEqual([line(2)]);
		expect(new Date(result[0]!.expiry).getTime() - new Date(result[0]!.checkedAt).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
	});

	it("advances the cursor in memory and does not query again", async () => {
		const { service, repository } = createService();
		const logs = [{ containerId: "container-1", containerName: "web", lines: [line(1)] }];

		expect(await service.buildDockerLogs(status(logs))).toHaveLength(1);
		expect(await service.buildDockerLogs(status(logs))).toEqual([]);
		expect(repository.findLastLineTimestamp).toHaveBeenCalledTimes(1);
	});

	it("sets gap only when every tail line is fresh", async () => {
		const { service } = createService();
		const lines = Array.from({ length: DOCKER_LOG_TAIL_LINES }, (_, index) => ({
			ts: `2026-01-01T00:00:00.${String(index).padStart(9, "0")}Z`,
			stream: "stdout" as const,
			text: String(index),
		}));

		const [result] = await service.buildDockerLogs(status([{ containerId: "container-1", containerName: "web", lines }]));
		expect(result?.gap).toBe(true);
	});

	it("skips a failed container and continues with the others", async () => {
		const { service, repository, logger } = createService();
		repository.findLastLineTimestamp.mockRejectedValueOnce(new Error("DB down")).mockResolvedValueOnce(null);

		const result = await service.buildDockerLogs(
			status([
				{ containerId: "bad", containerName: "bad-container", lines: [line(1)] },
				{ containerId: "good", containerName: "good-container", lines: [line(2)] },
			])
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.metadata.containerId).toBe("good");
		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to build docker logs for container bad-container" }));
	});
});
