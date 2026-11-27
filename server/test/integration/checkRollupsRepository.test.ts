import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import { CheckRollupModel } from "../../src/domain/check-rollups/check-rollup.model.ts";
import MongoCheckRollupsRepository from "../../src/domain/check-rollups/check-rollup.repository.mongo.ts";

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

const TEAM_ID = new mongoose.Types.ObjectId();
const OTHER_TEAM_ID = new mongoose.Types.ObjectId();
const MONITOR_ID = new mongoose.Types.ObjectId();
const OTHER_MONITOR_ID = new mongoose.Types.ObjectId();

const BUCKET_START = new Date("2026-03-10T10:00:00.000Z");
const at = (minutes: number, seconds = 0) => new Date(BUCKET_START.getTime() + minutes * 60_000 + seconds * 1000);

const seedCheck = (overrides: Record<string, unknown> = {}, metadata: Record<string, unknown> = {}) =>
	CheckModel.create({
		metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "http", ...metadata },
		status: true,
		responseTime: 100,
		createdAt: at(1),
		...overrides,
	});

const findRows = (monitorId = MONITOR_ID) => CheckRollupModel.find({ monitorId }).sort({ bucketStart: 1 }).lean();

describe("MongoCheckRollupsRepository.rollUp", () => {
	it("writes one row per monitor per 15-minute bucket", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ createdAt: at(0) });
		await seedCheck({ createdAt: at(14, 59) });
		await seedCheck({ createdAt: at(15) });
		await seedCheck({ createdAt: at(1) }, { monitorId: OTHER_MONITOR_ID });

		await repo.rollUp(at(0), at(30));

		const rows = await findRows();
		expect(rows.map((row) => row.bucketStart.toISOString())).toEqual(["2026-03-10T10:00:00.000Z", "2026-03-10T10:15:00.000Z"]);
		expect(rows.map((row) => row.totalChecks)).toEqual([2, 1]);
		expect(rows[0]).toMatchObject({ monitorId: MONITOR_ID, teamId: TEAM_ID, type: "http" });
		expect(await findRows(OTHER_MONITOR_ID)).toHaveLength(1);
	});

	it("treats the window as half-open", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ createdAt: at(0) });
		await seedCheck({ createdAt: at(15) });

		await repo.rollUp(at(0), at(15));

		const rows = await findRows();
		expect(rows).toHaveLength(1);
		expect(rows[0]?.bucketStart.toISOString()).toBe("2026-03-10T10:00:00.000Z");
	});

	it("splits up, down and degraded checks and keeps degraded checks out of every sum", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ responseTime: 100 });
		await seedCheck({ responseTime: 200 });
		await seedCheck({ status: false, responseTime: 5000 });
		await seedCheck({ status: false, responseTime: 9000, egressStatus: "degraded" });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row).toMatchObject({
			totalChecks: 3,
			upChecks: 2,
			downChecks: 1,
			degradedChecks: 1,
			responseTimeSum: 5300,
			responseTimeCount: 3,
			upResponseTimeSum: 300,
			upResponseTimeCount: 2,
			downResponseTimeSum: 5000,
			downResponseTimeCount: 1,
		});
	});

	it("writes a row with zero totals for a bucket of only degraded checks", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ status: false, egressStatus: "degraded" });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row).toMatchObject({ totalChecks: 0, upChecks: 0, downChecks: 0, degradedChecks: 1, responseTimeSum: 0, responseTimeCount: 0 });
	});

	it("counts a check without a response time but leaves it out of the response-time count", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ responseTime: 100 });
		await seedCheck({ responseTime: undefined });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row).toMatchObject({ totalChecks: 2, upChecks: 2, responseTimeSum: 100, responseTimeCount: 1, upResponseTimeCount: 1 });
	});

	it("sums timing phases, counting a check without timings as 0", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ timings: { start: 1, phases: { dns: 10, tcp: 20, tls: 30, request: 8, firstByte: 40, download: 6 } } });
		await seedCheck();

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row?.totalChecks).toBe(2);
		expect(row?.uptime).toEqual({ dnsSum: 10, tcpSum: 20, tlsSum: 30, requestSum: 8, firstByteSum: 40, downloadSum: 6 });
	});

	it.each(["hardware", "pagespeed", "docker", "unknown"])("writes no uptime block for a %s monitor", async (type) => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({}, { type });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row).toMatchObject({ type, totalChecks: 1 });
		expect(row).not.toHaveProperty("uptime");
	});

	it("is idempotent and picks up checks added since the last run", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck();
		await repo.rollUp(at(0), at(15));
		await repo.rollUp(at(0), at(15));
		expect(await findRows()).toHaveLength(1);

		await seedCheck({ createdAt: at(2) });
		await repo.rollUp(at(0), at(15));

		const rows = await findRows();
		expect(rows).toHaveLength(1);
		expect(rows[0]?.totalChecks).toBe(2);
	});

	it("stamps updatedAt on every roll", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck();
		const before = Date.now();
		await repo.rollUp(at(0), at(15));
		const [first] = await findRows();
		expect(first?.updatedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);

		await new Promise((resolve) => setTimeout(resolve, 50));
		await repo.rollUp(at(0), at(15));

		const [second] = await findRows();
		expect(second?.updatedAt.getTime()).toBeGreaterThan(first?.updatedAt.getTime() ?? 0);
	});

	it("keeps fields it does not write when it re-rolls a row", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck();
		await repo.rollUp(at(0), at(15));
		await CheckRollupModel.collection.updateOne({ monitorId: MONITOR_ID }, { $set: { unwritten: { value: 5 } } });

		await seedCheck({ createdAt: at(2) });
		await repo.rollUp(at(0), at(15));

		const row = await CheckRollupModel.collection.findOne({ monitorId: MONITOR_ID });
		expect(row?.totalChecks).toBe(2);
		expect(row?.unwritten).toEqual({ value: 5 });
	});
});

describe("MongoCheckRollupsRepository.findLatestBucketStart", () => {
	it("returns null when there are no rows", async () => {
		const repo = new MongoCheckRollupsRepository();

		await expect(repo.findLatestBucketStart()).resolves.toBeNull();
	});

	it("returns the newest bucket across all monitors", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ createdAt: at(1) });
		await seedCheck({ createdAt: at(31) }, { monitorId: OTHER_MONITOR_ID });
		await repo.rollUp(at(0), at(45));

		const latest = await repo.findLatestBucketStart();

		expect(latest?.toISOString()).toBe("2026-03-10T10:30:00.000Z");
	});
});

describe("MongoCheckRollupsRepository deletes", () => {
	const seedTwoMonitors = async (repo: MongoCheckRollupsRepository) => {
		await seedCheck({ createdAt: at(1) });
		await seedCheck({ createdAt: at(16) });
		await seedCheck({ createdAt: at(1) }, { monitorId: OTHER_MONITOR_ID, teamId: OTHER_TEAM_ID });
		await repo.rollUp(at(0), at(30));
	};

	it("deletes every row of one monitor", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedTwoMonitors(repo);

		await expect(repo.deleteByMonitorId(MONITOR_ID.toString())).resolves.toBe(2);

		expect(await findRows()).toHaveLength(0);
		expect(await findRows(OTHER_MONITOR_ID)).toHaveLength(1);
	});

	it("deletes every row of one team", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedTwoMonitors(repo);

		await expect(repo.deleteByTeamId(OTHER_TEAM_ID.toString())).resolves.toBe(1);

		expect(await findRows()).toHaveLength(2);
		expect(await findRows(OTHER_MONITOR_ID)).toHaveLength(0);
	});

	it("deletes rows of monitors that are not in the given list", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedTwoMonitors(repo);

		await expect(repo.deleteByMonitorIdsNotIn([MONITOR_ID.toString()])).resolves.toBe(1);

		expect(await findRows()).toHaveLength(2);
		expect(await findRows(OTHER_MONITOR_ID)).toHaveLength(0);
	});
});
