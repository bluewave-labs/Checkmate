import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { Check, DockerChecksResult, HardwareChecksResult, UptimeChecksResult } from "../../src/domain/checks/check.type.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The guarantee under test — a check flagged egressStatus "degraded" is left out of
// every uptime percentage and down-count while still appearing in listings and in
// the response-time series — lives in $match stages spread into several aggregation
// pipelines, so it can only be exercised against a live mongod.

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

const MONITOR_ID = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();

// One shared createdAt keeps every seeded check in the same bucket of the "day" range.
const BUCKET_TIME = new Date(Date.now() - 10 * 60 * 1000);

const seedCheck = (overrides: Record<string, unknown> = {}) =>
	CheckModel.create({
		metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "http" },
		status: true,
		responseTime: 100,
		createdAt: BUCKET_TIME,
		...overrides,
	});

const seedDegradedFailure = (overrides: Record<string, unknown> = {}) =>
	seedCheck({ status: false, responseTime: 300, egressStatus: "degraded", ...overrides });

const utcDate = (date: Date) => date.toISOString().slice(0, 10);

const makeCheck = (overrides: Partial<Check> = {}): Check =>
	({
		metadata: { monitorId: MONITOR_ID.toString(), teamId: TEAM_ID.toString(), type: "http" },
		status: false,
		responseTime: 300,
		statusCode: 500,
		message: "Error",
		createdAt: BUCKET_TIME.toISOString(),
		updatedAt: BUCKET_TIME.toISOString(),
		...overrides,
	}) as Check;

describe("MongoChecksRepository degraded-egress exclusion", () => {
	let repo: MongoChecksRepository;

	beforeEach(() => {
		repo = new MongoChecksRepository(createMockLogger() as unknown as ILogger);
	});

	it("round-trips egressStatus through createChecks and the unevaluated-checks read, leaving it absent when unset", async () => {
		await repo.createChecks([makeCheck({ egressStatus: "degraded" }), makeCheck({ egressStatus: "ok" }), makeCheck()]);

		const checks = await repo.findUnevaluatedByMonitorId(MONITOR_ID.toString(), BUCKET_TIME.getTime() - 1);

		// The evaluator runs from this read, so the flag must survive persistence for the short-circuit to fire.
		expect(checks.map((check) => check.egressStatus)).toEqual(["degraded", "ok", undefined]);
		expect(checks[2].egressStatus).toBeUndefined();
	});

	it("rejects a value outside the EgressStatuses tuple", async () => {
		await expect(seedCheck({ status: false, egressStatus: "unknown" })).rejects.toThrow(/egressStatus/);
	});

	it("excludes degraded checks from the uptime percentage but keeps them in the response-time series", async () => {
		await seedCheck(); // up
		await seedCheck({ status: false }); // real failure
		await seedDegradedFailure();
		await seedDegradedFailure();

		const result = (await repo.findByDateRangeAndMonitorId(MONITOR_ID.toString(), "day", { type: "http" })) as UptimeChecksResult;

		// 1 up of 2 attributable checks. Counting the degraded pair would give 25%.
		expect(result.uptimePercentage).toBe(0.5);
		// The graph still shows the degraded checks as failures, and their response times stay in the averages.
		expect(result.avgResponseTime).toBe(200);
		expect(result.groupedChecks[0]).toMatchObject({ totalChecks: 4, avgResponseTime: 200 });
		expect(result.groupedDownChecks[0]).toMatchObject({ totalChecks: 3 });
		expect(result.groupedUpChecks[0]).toMatchObject({ totalChecks: 1 });
	});

	it("does not flag a failure that carries egressStatus ok", async () => {
		await seedCheck();
		await seedCheck({ status: false, egressStatus: "ok" });

		const result = (await repo.findByDateRangeAndMonitorId(MONITOR_ID.toString(), "day", { type: "http" })) as UptimeChecksResult;

		expect(result.uptimePercentage).toBe(0.5);
	});

	it("excludes degraded checks from the team summary totals", async () => {
		await seedCheck();
		await seedCheck({ status: false });
		await seedDegradedFailure();

		const summary = await repo.findSummaryByTeamId(TEAM_ID.toString(), "day");

		expect(summary).toEqual({ totalChecks: 2, downChecks: 1 });
	});

	it("excludes degraded checks from the daily status bucket counts but keeps them in its response-time average", async () => {
		const otherMonitor = new mongoose.Types.ObjectId();
		await seedCheck();
		await seedCheck({ status: false });
		await seedDegradedFailure();
		await seedDegradedFailure({ metadata: { monitorId: otherMonitor, teamId: TEAM_ID, type: "http" } });

		const buckets = await repo.getDailyStatusBuckets([MONITOR_ID.toString(), otherMonitor.toString()], 7, "UTC");

		// (100 + 100 + 300) / 3 = 167: the degraded check's response time counts, its failure does not.
		// The other monitor saw only degraded checks that day, so it gets no row rather than a 0/0 bucket.
		expect(buckets).toEqual([
			{ monitorId: MONITOR_ID.toString(), date: utcDate(BUCKET_TIME), totalChecks: 2, upChecks: 1, downChecks: 1, avgResponseTime: 167 },
		]);
	});

	it("excludes degraded checks from the hardware and docker totals", async () => {
		const hardwareMonitor = new mongoose.Types.ObjectId();
		const dockerMonitor = new mongoose.Types.ObjectId();
		const hardwareMeta = { monitorId: hardwareMonitor, teamId: TEAM_ID, type: "hardware" };
		const dockerMeta = { monitorId: dockerMonitor, teamId: TEAM_ID, type: "docker" };

		await seedCheck({ metadata: hardwareMeta });
		await seedDegradedFailure({ metadata: hardwareMeta });
		await seedCheck({ metadata: dockerMeta });
		await seedDegradedFailure({ metadata: dockerMeta });

		const hardware = (await repo.findByDateRangeAndMonitorId(hardwareMonitor.toString(), "day", { type: "hardware" })) as HardwareChecksResult;
		const docker = (await repo.findByDateRangeAndMonitorId(dockerMonitor.toString(), "day", { type: "docker" })) as DockerChecksResult;

		expect(hardware.aggregateData.totalChecks).toBe(1);
		expect(hardware.upChecks.totalChecks).toBe(1);
		expect(docker.aggregateData.totalChecks).toBe(1);
		expect(docker.upChecks.totalChecks).toBe(1);
	});

	it("excludes degraded checks from the docker bucket counts but keeps them in its response-time average", async () => {
		const dockerMonitor = new mongoose.Types.ObjectId();
		const dockerMeta = { monitorId: dockerMonitor, teamId: TEAM_ID, type: "docker" };

		await seedCheck({ metadata: dockerMeta });
		await seedDegradedFailure({ metadata: dockerMeta });

		const docker = (await repo.findByDateRangeAndMonitorId(dockerMonitor.toString(), "day", { type: "docker" })) as DockerChecksResult;

		expect(docker.aggregate).toHaveLength(1);
		expect(docker.aggregate[0]).toMatchObject({ upCount: 1, totalCount: 1, avgResponseTime: 200 });
	});

	it("keeps degraded checks in the paginated listing so they can be shown as such", async () => {
		await seedCheck({ status: false });
		await seedDegradedFailure();

		const { checksCount, checks } = await repo.findByMonitorId(MONITOR_ID.toString(), "desc", "day", 0, 10, undefined, "down");

		expect(checksCount).toBe(2);
		expect(checks.map((check) => check.egressStatus).sort()).toEqual([undefined, "degraded"].sort());
	});
});
