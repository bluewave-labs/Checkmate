import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { Check } from "../../src/domain/checks/check.type.ts";
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

const MONITOR_ID = new mongoose.Types.ObjectId();
const OTHER_MONITOR_ID = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const noonUtcDaysAgo = (days: number) => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - days);
	date.setUTCHours(12, 0, 0, 0);
	return date.getTime();
};
const utcDay = (ms: number) => `${new Date(ms).toISOString().slice(0, 10)}T00:00:00Z`;

const YESTERDAY = noonUtcDaysAgo(1);
const TWO_DAYS_AGO = noonUtcDaysAgo(2);

const makeCheck = (
	createdAtMs: number,
	overrides: Partial<Check> = {},
	monitorId = MONITOR_ID,
	type: Check["metadata"]["type"] = "hardware"
): Check => {
	const createdAt = new Date(createdAtMs).toISOString();
	return {
		id: new mongoose.Types.ObjectId().toString(),
		metadata: { monitorId: monitorId.toString(), teamId: TEAM_ID.toString(), type },
		status: true,
		statusCode: 200,
		responseTime: 1000,
		message: "OK",
		createdAt,
		updatedAt: createdAt,
		...overrides,
	};
};

const reading = (cpuUsage: number, memoryUsage: number, temperature: number[] | null = [40, 50]) => ({
	cpu: { physical_core: 4, logical_core: 8, frequency: 4800, current_frequency: 4000 + cpuUsage * 1000, temperature, usage_percent: cpuUsage },
	memory: { total_bytes: 1000, available_bytes: 1000 - memoryUsage * 1000, used_bytes: memoryUsage * 1000, usage_percent: memoryUsage },
});

const failed = { status: false, statusCode: 5000, message: "connect ECONNREFUSED" };

const setup = () => new MongoChecksRepository(createMockLogger() as unknown as ILogger);

describe("MongoChecksRepository.findHardwareMetrics", () => {
	it("returns an empty result for a monitor with no checks", async () => {
		const repo = setup();

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result).toEqual({ checks: { total: 0, up: 0 }, latest: null, buckets: [] });
	});

	it("averages each level per bucket, in bucket order", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.2, 0.4)),
			makeCheck(YESTERDAY + MINUTE_MS, reading(0.4, 0.6)),
			makeCheck(TWO_DAYS_AGO, reading(0.8, 0.1)),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result.buckets).toEqual([
			{
				bucketDate: utcDay(TWO_DAYS_AGO),
				cpu: { usage: 0.8, currentFrequency: 4800, temperature: [40, 50] },
				memory: { usedBytes: 100, availableBytes: 900, usage: 0.1 },
			},
			{
				bucketDate: utcDay(YESTERDAY),
				cpu: { usage: expect.closeTo(0.3, 10), currentFrequency: 4300, temperature: [40, 50] },
				memory: { usedBytes: 500, availableBytes: 500, usage: 0.5 },
			},
		]);
	});

	it("counts failed checks and leaves them out of the averages", async () => {
		const repo = setup();
		await repo.createChecks([makeCheck(YESTERDAY, reading(0.5, 0.4)), makeCheck(YESTERDAY + MINUTE_MS, failed)]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result.checks).toEqual({ total: 2, up: 1 });
		expect(result.buckets).toHaveLength(1);
		expect(result.buckets[0]?.cpu.usage).toBe(0.5);
		expect(result.buckets[0]?.memory.usage).toBe(0.4);
	});

	it("leaves null readings out of the averages", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.5, 0.4)),
			makeCheck(YESTERDAY + MINUTE_MS, {
				cpu: { usage_percent: null, current_frequency: null, temperature: null },
				memory: { usage_percent: null, used_bytes: null, available_bytes: null },
			}),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result.buckets).toEqual([
			{
				bucketDate: utcDay(YESTERDAY),
				cpu: { usage: 0.5, currentFrequency: 4500, temperature: [40, 50] },
				memory: { usedBytes: 400, availableBytes: 600, usage: 0.4 },
			},
		]);
	});

	it("returns a bucket of nulls when no check in it has a reading", async () => {
		const repo = setup();
		await repo.createChecks([makeCheck(YESTERDAY, failed)]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result.buckets).toEqual([
			{
				bucketDate: utcDay(YESTERDAY),
				cpu: { usage: null, currentFrequency: null, temperature: [] },
				memory: { usedBytes: null, availableBytes: null, usage: null },
			},
		]);
	});

	it("averages temperature per sensor position when the number of sensors changes", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.5, 0.4, [40, 50, 60])),
			makeCheck(YESTERDAY + MINUTE_MS, reading(0.5, 0.4, [60])),
			makeCheck(YESTERDAY + 2 * MINUTE_MS, reading(0.5, 0.4, null)),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result.buckets[0]?.cpu.temperature).toEqual([50, 50, 60]);
	});

	it("returns the newest successful check as latest, whatever the range", async () => {
		const repo = setup();
		const errors = [{ metric: ["cpu.temperature"], err: "no sensors" }];
		const takenAt = Date.now() - 40 * DAY_MS;
		await repo.createChecks([
			makeCheck(takenAt, {
				...reading(0.25, 0.75, null),
				host: { os: "linux", platform: "ubuntu", kernel_version: "7.0.0", pretty_name: null },
				capture: { version: "2.0.1", mode: "release" },
				errors,
			}),
			makeCheck(takenAt + DAY_MS, failed),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "day");

		expect(result.buckets).toEqual([]);
		expect(result.checks).toEqual({ total: 0, up: 0 });
		expect(result.latest).toEqual({
			checkedAt: new Date(takenAt).toISOString(),
			host: { os: "linux", platform: "ubuntu", kernelVersion: "7.0.0", prettyName: null },
			capture: { version: "2.0.1", mode: "release" },
			cpu: { physicalCore: 4, logicalCore: 8, frequency: 4800, currentFrequency: 4250, usage: 0.25, temperature: null },
			memory: { totalBytes: 1000, usedBytes: 750, availableBytes: 250, usage: 0.75 },
			errors,
		});
	});

	it("reads only hardware checks of the requested monitor", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.5, 0.4)),
			makeCheck(YESTERDAY, reading(0.9, 0.9), OTHER_MONITOR_ID),
			makeCheck(YESTERDAY, {}, MONITOR_ID, "http"),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result.checks).toEqual({ total: 1, up: 1 });
		expect(result.buckets[0]?.cpu.usage).toBe(0.5);
	});

	it("leaves out checks taken while egress was degraded", async () => {
		const repo = setup();
		await repo.createChecks([makeCheck(YESTERDAY, reading(0.5, 0.4)), makeCheck(YESTERDAY + MINUTE_MS, { ...failed, egressStatus: "degraded" })]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month");

		expect(result.checks).toEqual({ total: 1, up: 1 });
	});
});
