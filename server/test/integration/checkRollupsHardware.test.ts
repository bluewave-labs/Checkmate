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
const MONITOR_ID = new mongoose.Types.ObjectId();
const OTHER_MONITOR_ID = new mongoose.Types.ObjectId();

const BUCKET_START = new Date("2026-03-10T10:00:00.000Z");
const at = (minutes: number, seconds = 0) => new Date(BUCKET_START.getTime() + minutes * 60_000 + seconds * 1000);

const reading = (cpuUsage: number | null, memoryUsage: number | null, temperature: (number | null)[] | null = [40, 50]) => ({
	cpu: { usage_percent: cpuUsage, current_frequency: 3000, temperature },
	memory: { used_bytes: 400, available_bytes: 600, usage_percent: memoryUsage },
});

const seedCheck = (overrides: Record<string, unknown> = {}, metadata: Record<string, unknown> = {}) =>
	CheckModel.collection.insertOne({
		metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "hardware", ...metadata },
		status: true,
		responseTime: 100,
		createdAt: at(1),
		...overrides,
	});

const disk = (device: string, mountpoint: string, values: Record<string, number | null> = {}) => ({
	device,
	mountpoint,
	total_bytes: 1000,
	free_bytes: 700,
	used_bytes: 300,
	usage_percent: 0.3,
	total_inodes: 100,
	free_inodes: 90,
	used_inodes: 10,
	inodes_usage_percent: 0.1,
	read_bytes: 0,
	write_bytes: 0,
	read_time: 0,
	write_time: 0,
	...values,
});

const ROOT = ["/dev/sda1", "/"] as const;
const DATA = ["/dev/sdb1", "/data"] as const;
const MINUTE_MS = 60 * 1000;
const INTERVALS = [{ monitorId: MONITOR_ID.toString(), intervalMs: MINUTE_MS }];

const findRows = (monitorId = MONITOR_ID) => CheckRollupModel.find({ monitorId }).sort({ bucketStart: 1 }).lean();

describe("MongoCheckRollupsRepository.rollUp hardware block", () => {
	it("writes a sum and a count for each level", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4), createdAt: at(1) });
		await seedCheck({ ...reading(0.6, 0.5), createdAt: at(2) });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row?.hardware?.cpuUsage.sum).toBeCloseTo(0.8);
		expect(row?.hardware?.cpuUsage.count).toBe(2);
		expect(row?.hardware?.memoryUsage.sum).toBeCloseTo(0.9);
		expect(row?.hardware).toMatchObject({
			cpuCurrentFrequency: { sum: 6000, count: 2 },
			memoryUsedBytes: { sum: 800, count: 2 },
			memoryAvailableBytes: { sum: 1200, count: 2 },
			memoryUsage: { count: 2 },
		});
	});

	it("leaves an unknown value out of the sum and the count", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4), createdAt: at(1) });
		await seedCheck({ ...reading(null, 0.6), createdAt: at(2) });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row?.hardware?.cpuUsage).toEqual({ sum: 0.2, count: 1 });
		expect(row?.hardware?.memoryUsage.count).toBe(2);
	});

	it("keeps temperature per sensor position, across lists of different lengths", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4, [40, 50]), createdAt: at(1) });
		await seedCheck({ ...reading(0.2, 0.4, [60, 70, 80]), createdAt: at(2) });
		await seedCheck({ ...reading(0.2, 0.4, [20, null]), createdAt: at(3) });
		await seedCheck({ ...reading(0.2, 0.4, null), createdAt: at(4) });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row?.hardware?.temperature).toEqual([
			{ sum: 120, count: 3 },
			{ sum: 120, count: 2 },
			{ sum: 80, count: 1 },
		]);
	});

	it("writes an empty temperature list for a host without sensors", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4, null) });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row?.hardware?.temperature).toEqual([]);
	});

	it("gives a failed check a row with zero counts", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ status: false, statusCode: 5000 });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row).toMatchObject({ totalChecks: 1, upChecks: 0, downChecks: 1 });
		expect(row?.hardware).toMatchObject({ cpuUsage: { sum: 0, count: 0 }, memoryUsage: { sum: 0, count: 0 }, temperature: [] });
	});

	it("keeps checks taken while egress was degraded out of the block", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4), createdAt: at(1) });
		await seedCheck({ ...reading(0.9, 0.9), createdAt: at(2), egressStatus: "degraded" });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row?.hardware?.cpuUsage).toEqual({ sum: 0.2, count: 1 });
		expect(row?.degradedChecks).toBe(1);
	});

	it("writes one block per monitor per bucket", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4), createdAt: at(1) });
		await seedCheck({ ...reading(0.4, 0.4), createdAt: at(16) });
		await seedCheck({ ...reading(0.8, 0.4), createdAt: at(1) }, { monitorId: OTHER_MONITOR_ID });

		await repo.rollUp(at(0), at(30));

		const rows = await findRows();
		const [other] = await findRows(OTHER_MONITOR_ID);
		expect(rows.map((row) => row.hardware?.cpuUsage.sum)).toEqual([0.2, 0.4]);
		expect(other?.hardware?.cpuUsage.sum).toBe(0.8);
	});

	it("writes no block for a monitor that is not a hardware monitor", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({}, { type: "http" });

		await repo.rollUp(at(0), at(15));

		const [row] = await findRows();
		expect(row?.totalChecks).toBe(1);
		expect(row?.hardware).toBeUndefined();
	});

	it("is idempotent and leaves the core fields as the core pipeline wrote them", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4), createdAt: at(1) });
		await repo.rollUp(at(0), at(15));
		await seedCheck({ ...reading(0.6, 0.4), createdAt: at(2) });

		await repo.rollUp(at(0), at(15));
		await repo.rollUp(at(0), at(15));

		const rows = await findRows();
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ totalChecks: 2, upChecks: 2, responseTimeSum: 200, type: "hardware", teamId: TEAM_ID });
		expect(rows[0]?.hardware?.cpuUsage.count).toBe(2);
	});
});

describe("MongoCheckRollupsRepository.rollUp hardware disks", () => {
	const findDisks = async (monitorId = MONITOR_ID) => {
		const rows = await findRows(monitorId);
		return rows.map((row) => row.hardware?.disks ?? []);
	};

	it("writes a sum and a count for each disk level, matching disks by device and mountpoint", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ disk: [disk(...ROOT, { usage_percent: 0.2, used_bytes: 200 }), disk(...DATA, { usage_percent: 0.9 })], createdAt: at(1) });
		await seedCheck({ disk: [disk(...DATA, { usage_percent: 0.7 }), disk(...ROOT, { usage_percent: 0.4, used_bytes: 400 })], createdAt: at(2) });

		await repo.rollUp(at(0), at(15), INTERVALS);

		const [disks] = await findDisks();
		expect(disks.map((entry) => [entry.device, entry.mountpoint])).toEqual([
			["/dev/sda1", "/"],
			["/dev/sdb1", "/data"],
		]);
		expect(disks[0]?.usage.sum).toBeCloseTo(0.6);
		expect(disks[0]).toMatchObject({ usage: { count: 2 }, usedBytes: { sum: 600, count: 2 }, usedInodes: { sum: 20, count: 2 } });
		expect(disks[1]?.usage.sum).toBeCloseTo(1.6);
	});

	it("stores the change and the seconds of each counter", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 1000, write_time: 500 })], createdAt: at(1) });
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 1600, write_time: 800 })], createdAt: at(2) });
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 1900, write_time: 800 })], createdAt: at(3) });

		await repo.rollUp(at(0), at(15), INTERVALS);

		const [disks] = await findDisks();
		expect(disks[0]).toMatchObject({
			readBytes: { change: 900, seconds: 120 },
			writeTime: { change: 300, seconds: 120 },
			writeBytes: { change: 0, seconds: 120 },
		});
	});

	it("counts the new value when a counter resets", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 900000 })], createdAt: at(1) });
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 600 })], createdAt: at(2) });

		await repo.rollUp(at(0), at(15), INTERVALS);

		const [disks] = await findDisks();
		expect(disks[0]?.readBytes).toEqual({ change: 600, seconds: 60 });
	});

	it("skips a pair more than three of that monitor's intervals apart", async () => {
		const repo = new MongoCheckRollupsRepository();
		const slow = { monitorId: OTHER_MONITOR_ID.toString(), intervalMs: 5 * MINUTE_MS };
		for (const monitorId of [MONITOR_ID, OTHER_MONITOR_ID]) {
			await seedCheck({ disk: [disk(...ROOT, { read_bytes: 0 })], createdAt: at(1) }, { monitorId });
			await seedCheck({ disk: [disk(...ROOT, { read_bytes: 6000 })], createdAt: at(11) }, { monitorId });
		}

		await repo.rollUp(at(0), at(15), [...INTERVALS, slow]);

		const [fast] = await findDisks(MONITOR_ID);
		const [slower] = await findDisks(OTHER_MONITOR_ID);
		expect(fast?.[0]?.readBytes).toEqual({ change: 0, seconds: 0 });
		expect(slower?.[0]?.readBytes).toEqual({ change: 6000, seconds: 600 });
	});

	it("gives a pair that spans two buckets to the bucket of the later check", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 0 })], createdAt: at(14, 30) });
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 600 })], createdAt: at(15, 30) });

		await repo.rollUp(at(0), at(30), INTERVALS);

		const [first, second] = await findDisks();
		expect(first?.[0]?.readBytes).toEqual({ change: 0, seconds: 0 });
		expect(second?.[0]?.readBytes).toEqual({ change: 600, seconds: 60 });
	});

	it("pairs the first check in the window with the one just before it, without rolling up the earlier bucket", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 0 })], createdAt: at(14, 30) });
		await seedCheck({ disk: [disk(...ROOT, { read_bytes: 600 })], createdAt: at(15, 30) });

		await repo.rollUp(at(15), at(30), INTERVALS);

		const rows = await findRows();
		expect(rows.map((row) => row.bucketStart.toISOString())).toEqual(["2026-03-10T10:15:00.000Z"]);
		expect(rows[0]?.hardware?.disks?.[0]?.readBytes).toEqual({ change: 600, seconds: 60 });
	});

	it("stores no change when the agent sent no I/O values", async () => {
		const repo = new MongoCheckRollupsRepository();
		const noIo = { read_bytes: null, write_bytes: null, read_time: null, write_time: null };
		await seedCheck({ disk: [disk(...ROOT, noIo)], createdAt: at(1) });
		await seedCheck({ disk: [disk(...ROOT, noIo)], createdAt: at(2) });

		await repo.rollUp(at(0), at(15), INTERVALS);

		const [disks] = await findDisks();
		expect(disks[0]).toMatchObject({ readBytes: { change: 0, seconds: 0 }, usage: { count: 2 } });
	});

	it("keeps the levels block and the disks beside each other across re-rolls", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4), disk: [disk(...ROOT)], createdAt: at(1) });

		await repo.rollUp(at(0), at(15), INTERVALS);
		await repo.rollUp(at(0), at(15), INTERVALS);

		const [row] = await findRows();
		expect(row?.hardware?.cpuUsage).toEqual({ sum: 0.2, count: 1 });
		expect(row?.hardware?.temperature).toHaveLength(2);
		expect(row?.hardware?.disks).toHaveLength(1);
		expect(row?.totalChecks).toBe(1);
	});

	it("writes no disks without intervals, and none for a monitor that is not listed", async () => {
		const repo = new MongoCheckRollupsRepository();
		await seedCheck({ ...reading(0.2, 0.4), disk: [disk(...ROOT)], createdAt: at(1) });

		await repo.rollUp(at(0), at(15));
		const [withoutIntervals] = await findRows();
		await repo.rollUp(at(0), at(15), [{ monitorId: OTHER_MONITOR_ID.toString(), intervalMs: MINUTE_MS }]);
		const [notListed] = await findRows();

		expect(withoutIntervals?.hardware?.cpuUsage.count).toBe(1);
		expect(withoutIntervals?.hardware?.disks).toBeUndefined();
		expect(notListed?.hardware?.disks).toBeUndefined();
	});
});
