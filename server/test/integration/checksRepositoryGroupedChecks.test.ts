import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { UptimeChecksResult } from "../../src/domain/checks/check.type.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The guarantee under test — every phase average uses the full bucket as its
// denominator — IS the $ifNull-inside-$avg behavior of the groupedChecks facet, so it
// can only be exercised against a live aggregation engine. Reused keep-alive sockets
// produce checks with no timings subdocument at all; without the coercion, $avg would
// skip them and average dns/tcp/tls over fresh-connection checks only.

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

// One shared createdAt puts every seeded check in the same hourly bucket of the "day"
// range, keeping the facet's group stage deterministic.
const BUCKET_TIME = new Date(Date.now() - 10 * 60 * 1000);

const seedCheck = (overrides: Record<string, unknown> = {}) =>
	CheckModel.create({
		metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "http" },
		status: true,
		responseTime: 100,
		createdAt: BUCKET_TIME,
		...overrides,
	});

const findGrouped = async (repo: MongoChecksRepository) =>
	(await repo.findByDateRangeAndMonitorId(MONITOR_ID.toString(), "day", { type: "http" })) as UptimeChecksResult;

describe("MongoChecksRepository groupedChecks facet", () => {
	let repo: MongoChecksRepository;

	beforeEach(() => {
		repo = new MongoChecksRepository(createMockLogger() as unknown as ILogger);
	});

	it("averages each phase over the full bucket, counting checks without timings as 0", async () => {
		await seedCheck({
			responseTime: 100,
			timings: { phases: { dns: 10, tcp: 20, tls: 30, request: 8, firstByte: 40, download: 6 } },
		});
		await seedCheck({ responseTime: 200 }); // reused socket: no timings subdocument at all

		const result = await findGrouped(repo);

		expect(result.groupedChecks).toHaveLength(1);
		// Plain $avg would skip the timings-less check and report 10/20/30/8/40/6 here.
		expect(result.groupedChecks[0]).toMatchObject({
			totalChecks: 2,
			avgDns: 5,
			avgTcp: 10,
			avgTls: 15,
			avgRequest: 4,
			avgFirstByte: 20,
			avgDownload: 3,
			avgResponseTime: 150,
		});
	});

	it("yields 0 (not null) for every phase in a bucket of only timings-less checks", async () => {
		await seedCheck();
		await seedCheck();

		const result = await findGrouped(repo);

		expect(result.groupedChecks).toHaveLength(1);
		// The client sums these fields for the stacked chart; null would poison the math.
		expect(result.groupedChecks[0]).toMatchObject({
			totalChecks: 2,
			avgDns: 0,
			avgTcp: 0,
			avgTls: 0,
			avgRequest: 0,
			avgFirstByte: 0,
			avgDownload: 0,
		});
	});
});
