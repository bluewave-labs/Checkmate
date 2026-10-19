import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoSettingsRepository from "../../src/domain/app-settings/app-settings.repository.mongo.ts";
import { AppSettingsModel } from "../../src/domain/app-settings/app-settings.model.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Each team edits its own share of the instance-wide egress notification list. The pipeline update
// that does it is what keeps two admins saving at once from overwriting each other, so it needs a live engine.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await AppSettingsModel.deleteMany({});
});

describe("MongoSettingsRepository.replaceTeamEgressNotifications", () => {
	const repo = new MongoSettingsRepository();

	it("replaces the team's share and keeps other teams' channels", async () => {
		await repo.create({ egressNotifications: ["a-1", "a-2", "b-1"] });

		const updated = await repo.replaceTeamEgressNotifications(["a-1", "a-2", "a-3"], ["a-3"]);

		expect([...updated.egressNotifications].sort()).toEqual(["a-3", "b-1"]);
	});

	it("clears only the team's share when nothing is selected", async () => {
		await repo.create({ egressNotifications: ["a-1", "b-1"] });

		const updated = await repo.replaceTeamEgressNotifications(["a-1"], []);

		expect(updated.egressNotifications).toEqual(["b-1"]);
	});

	it("keeps both teams' selections when two admins save at once", async () => {
		await repo.create({ egressNotifications: [] });

		await Promise.all([repo.replaceTeamEgressNotifications(["a-1", "a-2"], ["a-1"]), repo.replaceTeamEgressNotifications(["b-1"], ["b-1"])]);

		const settings = await repo.findSingleton();
		expect([...(settings?.egressNotifications ?? [])].sort()).toEqual(["a-1", "b-1"]);
	});
});
