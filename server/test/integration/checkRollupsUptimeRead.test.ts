import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import { CheckRollupModel } from "../../src/domain/check-rollups/check-rollup.model.ts";
import MongoCheckRollupsRepository from "../../src/domain/check-rollups/check-rollup.repository.mongo.ts";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import type { UptimeChecksResult } from "../../src/domain/checks/check.type.ts";
import type { DateRange } from "../../src/types/query.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection();
	await CheckRollupModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await CheckModel.deleteMany({});
	await CheckRollupModel.deleteMany({});
});

const MONITOR_ID = new mongoose.Types.ObjectId();
const OTHER_MONITOR_ID = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const BUCKET_MS = 15 * MINUTE_MS;
const PHASES = { dns: 10, tcp: 20, tls: 30, request: 8, firstByte: 40, download: 6 };

const seedCheck = (ageMs: number, overrides: Record<string, unknown> = {}, monitorId = MONITOR_ID) =>
	CheckModel.create({
		metadata: { monitorId, teamId: TEAM_ID, type: "http" },
		status: true,
		responseTime: 100,
		createdAt: new Date(Date.now() - ageMs),
		...overrides,
	});

const setup = () => {
	const rollups = new MongoCheckRollupsRepository();
	const checks = new MongoChecksRepository(createMockLogger() as unknown as ILogger);
	const rollUpEverything = () => rollups.rollUp(new Date(Date.now() - 400 * DAY_MS), new Date(Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS));
	const readRollups = (dateRange: DateRange) => rollups.findUptimeDateRange(MONITOR_ID.toString(), "http", dateRange);
	const readRaw = async (dateRange: DateRange) =>
		(await checks.findByDateRangeAndMonitorId(MONITOR_ID.toString(), dateRange, { type: "http" })) as UptimeChecksResult;
	return { rollUpEverything, readRollups, readRaw };
};

const rounded = (value: unknown): unknown => {
	if (typeof value === "number") return Math.round(value * 1e6) / 1e6;
	if (Array.isArray(value)) return value.map(rounded);
	if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rounded(entry)]));
	return value;
};

const seedHistory = async () => {
	await seedCheck(20 * DAY_MS, { responseTime: 80, timings: { start: 1, phases: PHASES } });
	await seedCheck(10 * DAY_MS, { status: false, responseTime: 9000, egressStatus: "degraded" });
	await seedCheck(3 * DAY_MS, { responseTime: 120 });
	await seedCheck(3 * DAY_MS - MINUTE_MS, { status: false, responseTime: 5000 });
	await seedCheck(5 * HOUR_MS, { responseTime: 150, timings: { start: 1, phases: PHASES } });
	await seedCheck(5 * HOUR_MS - MINUTE_MS, { responseTime: 250 });
	await seedCheck(30 * MINUTE_MS, { responseTime: 90 });
	await seedCheck(20 * MINUTE_MS, { status: false, responseTime: 4000 });
	await seedCheck(1000, { responseTime: 70 });
	await seedCheck(5 * HOUR_MS, { responseTime: 999 }, OTHER_MONITOR_ID);
};

describe("MongoCheckRollupsRepository.findUptimeDateRange", () => {
	it.each(["day", "week", "month", "year", "all"] as const)("returns the same result as the raw query for the %s range", async (dateRange) => {
		const { rollUpEverything, readRollups, readRaw } = setup();
		await seedHistory();
		await rollUpEverything();

		const fromRollups = await readRollups(dateRange);
		const fromRaw = await readRaw(dateRange);

		expect(fromRollups.groupedChecks.length).toBeGreaterThan(0);
		expect(rounded(fromRollups)).toEqual(rounded(fromRaw));
	});

	it("reads the last two hours from raw checks when they have not been rolled up", async () => {
		const { readRollups } = setup();
		await seedCheck(30 * MINUTE_MS);
		await seedCheck(1000, { status: false });

		const result = await readRollups("day");

		expect(result.groupedChecks.reduce((sum, bucket) => sum + bucket.totalChecks, 0)).toBe(2);
		expect(result.uptimePercentage).toBe(0.5);
	});

	it("does not count a bucket twice when it is rolled up and inside the raw tail", async () => {
		const { rollUpEverything, readRollups } = setup();
		await seedCheck(30 * MINUTE_MS);
		await rollUpEverything();

		const result = await readRollups("day");

		expect(result.groupedChecks.reduce((sum, bucket) => sum + bucket.totalChecks, 0)).toBe(1);
	});

	it("leaves out a bucket that holds only degraded checks", async () => {
		const { rollUpEverything, readRollups } = setup();
		await seedCheck(3 * DAY_MS, { status: false, egressStatus: "degraded" });
		await rollUpEverything();

		const result = await readRollups("week");

		expect(result).toEqual({
			monitorType: "http",
			groupedChecks: [],
			groupedUpChecks: [],
			groupedDownChecks: [],
			uptimePercentage: 0,
			avgResponseTime: 0,
		});
	});

	it("averages timing phases over every check in the bucket", async () => {
		const { rollUpEverything, readRollups } = setup();
		await seedCheck(5 * HOUR_MS, { timings: { start: 1, phases: PHASES } });
		await seedCheck(5 * HOUR_MS, { responseTime: 200 });
		await rollUpEverything();

		const result = await readRollups("all");

		expect(result.groupedChecks).toHaveLength(1);
		expect(result.groupedChecks[0]).toMatchObject({
			totalChecks: 2,
			avgResponseTime: 150,
			avgDns: 5,
			avgTcp: 10,
			avgTls: 15,
			avgRequest: 4,
			avgFirstByte: 20,
			avgDownload: 3,
		});
	});

	it("returns an empty result for a monitor with no checks", async () => {
		const { readRollups } = setup();

		const result = await readRollups("month");

		expect(result.groupedChecks).toEqual([]);
		expect(result.uptimePercentage).toBe(0);
		expect(result.avgResponseTime).toBe(0);
	});
});
