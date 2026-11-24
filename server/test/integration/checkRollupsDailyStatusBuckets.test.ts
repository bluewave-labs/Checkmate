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

const MONITOR_A = new mongoose.Types.ObjectId();
const MONITOR_B = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const BUCKET_MS = 15 * MINUTE_MS;

const TODAY = new Date(Date.now() - 10 * MINUTE_MS);
const ONE_DAY_AGO = new Date(TODAY.getTime() - DAY_MS);

const utcDate = (date: Date) => date.toISOString().slice(0, 10);
const localDate = (date: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);

const daysAgoAtUtc = (days: number, hours: number, minutes: number) => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - days);
	date.setUTCHours(hours, minutes, 0, 0);
	return date;
};

const seedCheck = (monitorId: mongoose.Types.ObjectId, createdAt: Date, overrides: Record<string, unknown> = {}) =>
	CheckModel.create({
		metadata: { monitorId, teamId: TEAM_ID, type: "http" },
		status: true,
		responseTime: 100,
		createdAt,
		...overrides,
	});

const setup = () => {
	const repo = new MongoCheckRollupsRepository();
	const rollUpEverything = () => repo.rollUp(new Date(Date.now() - 400 * DAY_MS), new Date(Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS));
	return { repo, rollUpEverything };
};

describe("MongoCheckRollupsRepository.getDailyStatusBuckets", () => {
	it("groups by monitor and calendar day with up and down counts, and returns no row for a day without checks", async () => {
		const { repo, rollUpEverything } = setup();
		await seedCheck(MONITOR_A, TODAY, { responseTime: 100 });
		await seedCheck(MONITOR_A, TODAY, { responseTime: 300 });
		await seedCheck(MONITOR_A, TODAY, { status: false, responseTime: 200 });
		await seedCheck(MONITOR_A, ONE_DAY_AGO, { responseTime: 100 });
		await seedCheck(MONITOR_A, ONE_DAY_AGO, { status: false, responseTime: undefined });
		await seedCheck(MONITOR_B, TODAY, { status: false, responseTime: undefined });
		await rollUpEverything();

		const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString(), MONITOR_B.toString()], 7, "UTC");

		expect(buckets.filter((bucket) => bucket.monitorId === MONITOR_A.toString())).toEqual([
			{ monitorId: MONITOR_A.toString(), date: utcDate(ONE_DAY_AGO), totalChecks: 2, upChecks: 1, downChecks: 1, avgResponseTime: 100 },
			{ monitorId: MONITOR_A.toString(), date: utcDate(TODAY), totalChecks: 3, upChecks: 2, downChecks: 1, avgResponseTime: 200 },
		]);
		expect(buckets.filter((bucket) => bucket.monitorId === MONITOR_B.toString())).toEqual([
			{ monitorId: MONITOR_B.toString(), date: utcDate(TODAY), totalChecks: 1, upChecks: 0, downChecks: 1, avgResponseTime: null },
		]);
	});

	it("cuts day boundaries in the requested timezone", async () => {
		const { repo, rollUpEverything } = setup();
		const lateEveningInToronto = daysAgoAtUtc(1, 3, 30);
		await seedCheck(MONITOR_A, lateEveningInToronto);
		await rollUpEverything();

		const utcBuckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "UTC");
		const torontoBuckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "America/Toronto");

		expect(utcBuckets.map((bucket) => bucket.date)).toEqual([utcDate(lateEveningInToronto)]);
		expect(torontoBuckets.map((bucket) => bucket.date)).toEqual([localDate(lateEveningInToronto, "America/Toronto")]);
		expect(torontoBuckets[0]?.date).not.toBe(utcBuckets[0]?.date);
	});

	it.each([
		["Asia/Kolkata", 18, 25, 18, 35],
		["Asia/Kathmandu", 18, 10, 18, 20],
	])(
		"splits checks either side of midnight in %s, whose offset is not a whole hour",
		async (timezone, beforeHour, beforeMinute, afterHour, afterMinute) => {
			const { repo, rollUpEverything } = setup();
			const beforeMidnight = daysAgoAtUtc(2, beforeHour, beforeMinute);
			const afterMidnight = daysAgoAtUtc(2, afterHour, afterMinute);
			await seedCheck(MONITOR_A, beforeMidnight);
			await seedCheck(MONITOR_A, afterMidnight);
			await rollUpEverything();

			const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, timezone);

			expect(buckets).toEqual([
				expect.objectContaining({ date: localDate(beforeMidnight, timezone), totalChecks: 1 }),
				expect.objectContaining({ date: localDate(afterMidnight, timezone), totalChecks: 1 }),
			]);
			expect(buckets[0]?.date).not.toBe(buckets[1]?.date);
		}
	);

	it("reads the last two hours from raw checks and does not count a rolled bucket twice", async () => {
		const { repo, rollUpEverything } = setup();
		await seedCheck(MONITOR_A, new Date(Date.now() - 30 * MINUTE_MS));
		await rollUpEverything();
		await seedCheck(MONITOR_A, new Date(Date.now() - 1000), { status: false });

		const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "UTC");

		expect(buckets.reduce((sum, bucket) => sum + bucket.totalChecks, 0)).toBe(2);
		expect(buckets.reduce((sum, bucket) => sum + bucket.downChecks, 0)).toBe(1);
	});

	it("excludes checks older than the requested window", async () => {
		const { repo, rollUpEverything } = setup();
		await seedCheck(MONITOR_A, new Date(Date.now() - 10 * DAY_MS));
		await seedCheck(MONITOR_A, TODAY);
		await rollUpEverything();

		const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "UTC");

		expect(buckets).toHaveLength(1);
		expect(buckets[0]).toMatchObject({ date: utcDate(TODAY), totalChecks: 1 });
	});

	it("excludes degraded checks, and returns no row for a monitor whose day holds only degraded checks", async () => {
		const { repo, rollUpEverything } = setup();
		await seedCheck(MONITOR_A, ONE_DAY_AGO);
		await seedCheck(MONITOR_A, ONE_DAY_AGO, { status: false });
		await seedCheck(MONITOR_A, ONE_DAY_AGO, { status: false, responseTime: 9000, egressStatus: "degraded" });
		await seedCheck(MONITOR_B, ONE_DAY_AGO, { status: false, egressStatus: "degraded" });
		await rollUpEverything();

		const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString(), MONITOR_B.toString()], 7, "UTC");

		expect(buckets).toEqual([
			{ monitorId: MONITOR_A.toString(), date: utcDate(ONE_DAY_AGO), totalChecks: 2, upChecks: 1, downChecks: 1, avgResponseTime: 100 },
		]);
	});

	it("leaves out monitors that were not asked for", async () => {
		const { repo, rollUpEverything } = setup();
		await seedCheck(MONITOR_A, ONE_DAY_AGO);
		await seedCheck(MONITOR_B, ONE_DAY_AGO);
		await seedCheck(MONITOR_B, TODAY);
		await rollUpEverything();

		const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "UTC");

		expect(buckets.map((bucket) => bucket.monitorId)).toEqual([MONITOR_A.toString()]);
	});
});
