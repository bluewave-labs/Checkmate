import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The guarantees under test — timezone-correct $dateTrunc day boundaries, $avg
// skipping missing responseTime (null bucket, not 0), and zero-check days yielding
// no rows — are all aggregation-engine behavior, so they can only be exercised
// against a live mongod.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection(); // timeseries collections must exist before insert
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await CheckModel.deleteMany({});
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONITOR_A = new mongoose.Types.ObjectId();
const MONITOR_B = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();

const DAY_MS = 24 * 60 * 60 * 1000;

// One shared instant per seeded "day" keeps every check of that day in the same
// bucket no matter when the test runs; instants exactly 24h apart always land on
// distinct calendar days.
const TODAY = new Date(Date.now() - 10 * 60 * 1000);
const ONE_DAY_AGO = new Date(TODAY.getTime() - DAY_MS);

const utcDate = (date: Date) => date.toISOString().slice(0, 10);

// Yesterday at 03:30 UTC: in America/Toronto that is 23:30 (EDT) or 22:30 (EST)
// of the *prior* day, so the local calendar date is always one behind UTC.
const yesterdayAtUtc = (hours: number, minutes: number) => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - 1);
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

describe("MongoChecksRepository getDailyStatusBuckets", () => {
	let repo: MongoChecksRepository;

	beforeEach(() => {
		repo = new MongoChecksRepository(createMockLogger() as unknown as ILogger);
	});

	it("groups by monitor and calendar day with up/down math; zero-check days produce no rows", async () => {
		await seedCheck(MONITOR_A, TODAY, { responseTime: 100 });
		await seedCheck(MONITOR_A, TODAY, { responseTime: 300 });
		await seedCheck(MONITOR_A, TODAY, { status: false, responseTime: 200 });
		await seedCheck(MONITOR_A, ONE_DAY_AGO, { responseTime: 100 });
		await seedCheck(MONITOR_A, ONE_DAY_AGO, { status: false, responseTime: undefined });
		await seedCheck(MONITOR_B, TODAY, { status: false, responseTime: undefined });
		// Two days ago is deliberately unseeded: the gap day must be absent, not zero-filled.

		const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString(), MONITOR_B.toString()], 7, "UTC");

		const monitorABuckets = buckets.filter((bucket) => bucket.monitorId === MONITOR_A.toString());
		const monitorBBuckets = buckets.filter((bucket) => bucket.monitorId === MONITOR_B.toString());

		// Ascending by day; the day with a responseTime-less check averages over the
		// checks that have one ($avg skips missing) rather than coercing them to 0.
		expect(monitorABuckets).toEqual([
			{ monitorId: MONITOR_A.toString(), date: utcDate(ONE_DAY_AGO), totalChecks: 2, upChecks: 1, downChecks: 1, avgResponseTime: 100 },
			{ monitorId: MONITOR_A.toString(), date: utcDate(TODAY), totalChecks: 3, upChecks: 2, downChecks: 1, avgResponseTime: 200 },
		]);
		// A day where no check recorded a responseTime yields null, not 0.
		expect(monitorBBuckets).toEqual([
			{ monitorId: MONITOR_B.toString(), date: utcDate(TODAY), totalChecks: 1, upChecks: 0, downChecks: 1, avgResponseTime: null },
		]);
	});

	it("cuts day boundaries in the requested timezone", async () => {
		const lateEveningLocal = yesterdayAtUtc(3, 30);
		await seedCheck(MONITOR_A, lateEveningLocal);

		const utcBuckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "UTC");
		const torontoBuckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "America/Toronto");

		const previousUtcDay = new Date(lateEveningLocal);
		previousUtcDay.setUTCDate(previousUtcDay.getUTCDate() - 1);

		expect(utcBuckets).toHaveLength(1);
		expect(utcBuckets[0].date).toBe(utcDate(lateEveningLocal));
		expect(torontoBuckets).toHaveLength(1);
		expect(torontoBuckets[0].date).toBe(utcDate(previousUtcDay));
	});

	it("excludes checks older than the requested window", async () => {
		await seedCheck(MONITOR_A, new Date(Date.now() - 10 * DAY_MS));
		await seedCheck(MONITOR_A, TODAY);

		const buckets = await repo.getDailyStatusBuckets([MONITOR_A.toString()], 7, "UTC");

		expect(buckets).toHaveLength(1);
		expect(buckets[0]).toMatchObject({ date: utcDate(TODAY), totalChecks: 1 });
	});
});
