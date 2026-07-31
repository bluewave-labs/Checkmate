import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MonitorModel } from "../../src/domain/monitors/monitor.model.ts";
import MongoMonitorsRepository from "../../src/domain/monitors/monitor.repository.mongo.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await MonitorModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await MonitorModel.deleteMany({});
});

const seedMonitor = (teamId: mongoose.Types.ObjectId, name: string, tags: mongoose.Types.ObjectId[]) =>
	MonitorModel.create({
		userId: new mongoose.Types.ObjectId(),
		teamId,
		name,
		type: "http",
		url: "https://example.com",
		tags,
	});

describe("MongoMonitorsRepository", () => {
	describe("tag filtering", () => {
		it("matches ObjectId tag references when filters arrive as query strings", async () => {
			const repo = new MongoMonitorsRepository();
			const teamId = new mongoose.Types.ObjectId();
			const selectedTagId = new mongoose.Types.ObjectId();
			const otherTagId = new mongoose.Types.ObjectId();

			await seedMonitor(teamId, "selected", [selectedTagId]);
			await seedMonitor(teamId, "not-selected", [otherTagId]);
			await seedMonitor(new mongoose.Types.ObjectId(), "other-team", [selectedTagId]);

			const tags = selectedTagId.toString();
			const monitors = await repo.findByTeamIdWithStats(teamId.toString(), { tags });
			const summary = await repo.findMonitorsSummaryByTeamId(teamId.toString(), { tags });

			expect(monitors.map((monitor) => monitor.name)).toEqual(["selected"]);
			expect(summary.totalMonitors).toBe(1);
		});
	});
});
