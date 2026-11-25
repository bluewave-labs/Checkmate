import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import { CheckService } from "../../src/domain/checks/check.service.ts";
import type { HardwareChecksResult } from "../../src/domain/checks/check.type.ts";
import type { ICheckRollupsRepository } from "../../src/domain/check-rollups/check-rollup.repository.interface.ts";
import type { IMonitorsRepository } from "../../src/domain/monitors/monitor.repository.interface.ts";
import type { HardwareStatusPayload, MonitorStatusResponse } from "../../src/types/network.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await CheckModel.deleteMany({});
});

const MONITOR_ID = new mongoose.Types.ObjectId().toString();
const TEAM_ID = new mongoose.Types.ObjectId().toString();

const setup = () => {
	const logger = createMockLogger() as unknown as ILogger;
	const repo = new MongoChecksRepository(logger);
	const service = new CheckService({} as IMonitorsRepository, logger, repo, {} as ICheckRollupsRepository);
	return { repo, service };
};

const agentResponse = (payload: HardwareStatusPayload): MonitorStatusResponse<HardwareStatusPayload> => ({
	monitorId: MONITOR_ID,
	teamId: TEAM_ID,
	type: "hardware",
	status: true,
	code: 200,
	message: "OK",
	responseTime: 1000,
	payload,
});

describe("hardware check ingest", () => {
	it("stores a value the agent could not read as null and leaves it out of the averages", async () => {
		const { repo, service } = setup();
		const read = service.toCheck(
			agentResponse({
				data: {
					cpu: { usage_percent: 0.5, free_percent: 0.5 },
					memory: { total_bytes: 1000, available_bytes: 600, used_bytes: 400, usage_percent: 0.4 },
				},
				errors: undefined,
			})
		);
		const unread = service.toCheck(
			agentResponse({
				data: {
					cpu: { usage_percent: 0, free_percent: 1 },
					memory: { total_bytes: 0, available_bytes: 0, used_bytes: 0, usage_percent: 0 },
				},
				errors: [
					{ metric: ["cpu.usage_percent"], err: "sampling failed" },
					{ metric: ["memory.total_bytes", "memory.available_bytes", "memory.used_bytes", "memory.usage_percent"], err: "no meminfo" },
				],
			})
		);
		if (!read || !unread) throw new Error("toCheck returned no check");

		await repo.createChecks([read, unread]);
		const stored = await CheckModel.collection.findOne({ _id: new mongoose.Types.ObjectId(unread.id) });
		const result = (await repo.findByDateRangeAndMonitorId(MONITOR_ID, "all", { type: "hardware" })) as HardwareChecksResult;

		expect(stored?.cpu).toEqual({ usage_percent: null, free_percent: null });
		expect(stored?.memory).toEqual({ total_bytes: null, available_bytes: null, used_bytes: null, usage_percent: null });
		expect(result.aggregateData.totalChecks).toBe(2);
		expect(result.checks.map((bucket) => bucket.avgCpuUsage)).toEqual([0.5]);
		expect(result.checks.map((bucket) => bucket.avgMemoryUsage)).toEqual([0.4]);
	});
});
