import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import { NETWORK_ERROR } from "../../src/types/network.ts";
import type { CheckFilter } from "../../src/types/query.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────

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
const CREATED_AT = new Date(Date.now() - 10 * 60 * 1000);

const seedCheck = (overrides: Record<string, unknown> = {}) =>
	CheckModel.create({
		metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "http" },
		status: true,
		responseTime: 100,
		createdAt: CREATED_AT,
		...overrides,
	});

const seedMixedChecks = async () => {
	await seedCheck({ status: true, statusCode: 200 });
	await seedCheck({ status: false, statusCode: 500 });
	await seedCheck({ status: false, statusCode: NETWORK_ERROR });
};

const setup = () => new MongoChecksRepository(createMockLogger() as unknown as ILogger);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MongoChecksRepository check filters", () => {
	it.each<[CheckFilter | undefined, number]>([
		[undefined, 3],
		["all", 3],
		["up", 1],
		["down", 2],
		["resolve", 1],
	])("filter %s returns %i of the seeded checks", async (filter, expected) => {
		const repo = setup();
		await seedMixedChecks();

		const byMonitor = await repo.findByMonitorId(MONITOR_ID.toString(), "desc", "day", 0, 10, undefined, filter);
		const byTeam = await repo.findByTeamId("desc", "day", 0, 10, TEAM_ID.toString(), filter);

		expect(byMonitor.checksCount).toBe(expected);
		expect(byTeam.checksCount).toBe(expected);
	});
});
