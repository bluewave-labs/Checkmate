import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type {
	Check,
	DockerChecksResult,
	HardwareChecksResult,
	PageSpeedChecksResult,
	UptimeChecksResult,
} from "../../src/domain/checks/check.type.ts";
import { NETWORK_ERROR } from "../../src/types/network.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The guarantee under test — a check flagged egressStatus "degraded" is left out of
// every aggregate, so a degraded episode reads as a gap in monitoring, while the check
// still appears in listings — lives in $match stages spread into several aggregation
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
		const created = await repo.createChecks([makeCheck({ egressStatus: "degraded" }), makeCheck({ egressStatus: "ok" }), makeCheck()]);
		const pending = created.map((check) => ({ checkId: check.id as string, createdAt: new Date(check.createdAt as string).getTime() }));

		const checks = await repo.findUnevaluatedByMonitorId(MONITOR_ID.toString(), pending);

		// The evaluator runs from this read, so the flag must survive persistence for the short-circuit to fire.
		expect(checks.map((check) => check.egressStatus)).toEqual(["degraded", "ok", undefined]);
		expect(checks[2].egressStatus).toBeUndefined();
	});

	it("rejects a value outside the EgressStatuses tuple", async () => {
		await expect(seedCheck({ status: false, egressStatus: "unknown" })).rejects.toThrow(/egressStatus/);
	});

	it("excludes degraded checks from the uptime percentage and from the response-time series alike", async () => {
		await seedCheck(); // up
		await seedCheck({ status: false }); // real failure
		await seedDegradedFailure();
		await seedDegradedFailure();

		const result = (await repo.findByDateRangeAndMonitorId(MONITOR_ID.toString(), "day", { type: "http" })) as UptimeChecksResult;

		// 1 up of 2 attributable checks. Counting the degraded pair would give 25%.
		expect(result.uptimePercentage).toBe(0.5);
		// Every series sees the same two checks, so the episode is a gap rather than a dip.
		expect(result.avgResponseTime).toBe(100);
		expect(result.groupedChecks[0]).toMatchObject({ totalChecks: 2, avgResponseTime: 100 });
		expect(result.groupedDownChecks[0]).toMatchObject({ totalChecks: 1 });
		expect(result.groupedUpChecks[0]).toMatchObject({ totalChecks: 1 });
	});

	it("leaves a bucket out of the response-time series entirely when every check in it was degraded", async () => {
		await seedDegradedFailure();
		await seedDegradedFailure();

		const result = (await repo.findByDateRangeAndMonitorId(MONITOR_ID.toString(), "day", { type: "http" })) as UptimeChecksResult;

		expect(result.groupedChecks).toEqual([]);
		expect(result.groupedDownChecks).toEqual([]);
		expect(result.uptimePercentage).toBe(0);
	});

	it("excludes degraded checks from the pagespeed series", async () => {
		await seedCheck({ metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "pagespeed" }, performance: 0.9 });
		await seedDegradedFailure({ metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "pagespeed" }, performance: 0.1 });

		const result = (await repo.findByDateRangeAndMonitorId(MONITOR_ID.toString(), "day", { type: "pagespeed" })) as PageSpeedChecksResult;

		expect(result.groupedChecks[0]).toMatchObject({ totalChecks: 1, performance: 0.9 });
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

	it("excludes degraded checks from the daily status buckets, dropping a day that saw nothing else", async () => {
		const otherMonitor = new mongoose.Types.ObjectId();
		await seedCheck();
		await seedCheck({ status: false });
		await seedDegradedFailure();
		await seedDegradedFailure({ metadata: { monitorId: otherMonitor, teamId: TEAM_ID, type: "http" } });

		const buckets = await repo.getDailyStatusBuckets([MONITOR_ID.toString(), otherMonitor.toString()], 7, "UTC");

		// The other monitor saw only degraded checks that day, so it gets no row rather than a 0/0 bucket.
		expect(buckets).toEqual([
			{ monitorId: MONITOR_ID.toString(), date: utcDate(BUCKET_TIME), totalChecks: 2, upChecks: 1, downChecks: 1, avgResponseTime: 100 },
		]);
	});

	it("keeps degraded checks in the paginated listing so they can be shown as such", async () => {
		await seedCheck({ status: false });
		await seedDegradedFailure();

		const { checksCount, checks } = await repo.findByMonitorId(MONITOR_ID.toString(), "desc", "day", 0, 10, undefined, "down");

		expect(checksCount).toBe(2);
		expect(checks.map((check) => check.egressStatus).sort()).toEqual([undefined, "degraded"].sort());
	});

	it("keeps degraded checks in the team listing and under the resolve filter", async () => {
		await seedCheck({ status: false, statusCode: NETWORK_ERROR });
		await seedDegradedFailure({ statusCode: NETWORK_ERROR });

		// The Checks page reads this listing when no single monitor is selected, and a degraded check has the
		// same shape the resolve filter looks for, so neither may quietly drop it.
		const team = await repo.findByTeamId("desc", "day", 0, 10, TEAM_ID.toString(), "down");
		const resolve = await repo.findByTeamId("desc", "day", 0, 10, TEAM_ID.toString(), "resolve");

		expect(team.checksCount).toBe(2);
		expect(resolve.checksCount).toBe(2);
		expect(resolve.checks.map((check) => check.egressStatus).sort()).toEqual([undefined, "degraded"].sort());
	});

	it("excludes degraded checks from the docker and hardware aggregates", async () => {
		const dockerMonitor = new mongoose.Types.ObjectId();
		const hardwareMonitor = new mongoose.Types.ObjectId();
		const dockerMeta = { monitorId: dockerMonitor, teamId: TEAM_ID, type: "docker" };
		const hardwareMeta = { monitorId: hardwareMonitor, teamId: TEAM_ID, type: "hardware" };

		// A Capture agent is reached by an outbound HTTP request and a docker daemon can be reached over TCP,
		// so both are egress attributable and their checks can carry the flag.
		await seedCheck({ metadata: dockerMeta });
		await seedDegradedFailure({ metadata: dockerMeta });
		await seedCheck({ metadata: hardwareMeta });
		await seedDegradedFailure({ metadata: hardwareMeta });

		const docker = (await repo.findByDateRangeAndMonitorId(dockerMonitor.toString(), "day", { type: "docker" })) as DockerChecksResult;
		const hardware = (await repo.findByDateRangeAndMonitorId(hardwareMonitor.toString(), "day", { type: "hardware" })) as HardwareChecksResult;

		expect(docker.aggregateData.totalChecks).toBe(1);
		expect(docker.aggregate[0]).toMatchObject({ upCount: 1, totalCount: 1 });
		expect(hardware.aggregateData.totalChecks).toBe(1);
		expect(hardware.upChecks.totalChecks).toBe(1);
	});
});
