import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import { CheckRollupModel } from "../../src/domain/check-rollups/check-rollup.model.ts";
import MongoCheckRollupsRepository from "../../src/domain/check-rollups/check-rollup.repository.mongo.ts";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckRollupService } from "../../src/domain/check-rollups/check-rollup.service.ts";
import type { IMonitorsRepository } from "../../src/domain/monitors/monitor.repository.interface.ts";
import type { ISettingsService } from "../../src/domain/app-settings/app-settings.service.ts";
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
const TEAM_ID = new mongoose.Types.ObjectId();
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const seedCheckAt = (createdAt: Date) =>
	CheckModel.create({ metadata: { monitorId: MONITOR_ID, teamId: TEAM_ID, type: "http" }, status: true, responseTime: 100, createdAt });

const setup = () => {
	const settingsService = { getDBSettings: async () => ({ checkTTL: 366 }) } as unknown as ISettingsService;
	const checksRepository = new MongoChecksRepository(createMockLogger() as unknown as ILogger);
	const monitorsRepository = { findAllForScheduling: async () => [] } as unknown as IMonitorsRepository;
	return new CheckRollupService(new MongoCheckRollupsRepository(), checksRepository, settingsService, monitorsRepository);
};

const totalRolledChecks = async () => {
	const rows = await CheckRollupModel.find({ monitorId: MONITOR_ID }).lean();
	return rows.reduce((sum, row) => sum + row.totalChecks, 0);
};

describe("CheckRollupService against MongoDB", () => {
	it("backfills every closed bucket from the oldest check and leaves the open bucket out", async () => {
		const service = setup();
		const now = Date.now();
		await seedCheckAt(new Date(now - 3 * DAY_MS));
		await seedCheckAt(new Date(now - 20 * MINUTE_MS));
		await seedCheckAt(new Date(now));

		await service.rollUpClosedBuckets();

		expect(await CheckRollupModel.countDocuments({ monitorId: MONITOR_ID })).toBe(2);
		expect(await totalRolledChecks()).toBe(2);
	});

	it("picks up a check that lands in an already rolled bucket", async () => {
		const service = setup();
		const now = Date.now();
		await seedCheckAt(new Date(now - 40 * MINUTE_MS));
		await service.rollUpClosedBuckets();

		await seedCheckAt(new Date(now - 40 * MINUTE_MS + 1000));
		await service.rollUpClosedBuckets();

		expect(await totalRolledChecks()).toBe(2);
	});
});
