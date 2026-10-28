import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MonitorStatsModel } from "../../src/domain/monitor-stats/monitor-stats.model.ts";
import MongoMonitorStatsRepository from "../../src/domain/monitor-stats/monitor-stats.repository.mongo.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await MonitorStatsModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await MonitorStatsModel.deleteMany({});
});

describe("MongoMonitorStatsRepository.findByMonitorId", () => {
	// Stats are created when a monitor's first check is evaluated, so a new monitor has none yet
	it("returns null for a monitor with no stats yet", async () => {
		const repo = new MongoMonitorStatsRepository();

		await expect(repo.findByMonitorId(new mongoose.Types.ObjectId().toString())).resolves.toBeNull();
	});

	it("returns the stats once the first check has been recorded", async () => {
		const repo = new MongoMonitorStatsRepository();
		const monitorId = new mongoose.Types.ObjectId().toString();
		await repo.updateByMonitorId(monitorId, { status: true, responseTime: 120, now: Date.now() });

		const stats = await repo.findByMonitorId(monitorId);

		expect(stats?.monitorId).toBe(monitorId);
	});
});
