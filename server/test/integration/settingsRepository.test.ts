import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoSettingsRepository from "../../src/domain/app-settings/app-settings.repository.mongo.ts";
import { AppSettingsModel } from "../../src/domain/app-settings/app-settings.model.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// "Generated once per database" rests on a conditional update: only the first writer
// sets the id and every other caller reads it back. That is MongoDB filter semantics,
// so it needs a live engine.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await AppSettingsModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await AppSettingsModel.deleteMany({});
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("MongoSettingsRepository", () => {
	const repo = new MongoSettingsRepository();

	describe("findOrCreateTelemetryInstanceId", () => {
		it("creates a uuid on first call and returns the same one afterwards", async () => {
			await AppSettingsModel.create({});

			const first = await repo.findOrCreateTelemetryInstanceId();
			const second = await repo.findOrCreateTelemetryInstanceId();

			expect(first).toMatch(UUID);
			expect(second).toBe(first);
		});

		it("persists the id on the settings singleton", async () => {
			await AppSettingsModel.create({});

			const id = await repo.findOrCreateTelemetryInstanceId();

			const doc = await AppSettingsModel.findOne({ singleton: true }).lean();
			expect(doc?.telemetryInstanceId).toBe(id);
		});

		it("returns one id to concurrent callers", async () => {
			await AppSettingsModel.create({});

			const ids = await Promise.all(Array.from({ length: 5 }, () => repo.findOrCreateTelemetryInstanceId()));

			expect(new Set(ids).size).toBe(1);
			expect(ids[0]).toMatch(UUID);
		});

		it("never overwrites an existing id", async () => {
			await AppSettingsModel.create({ telemetryInstanceId: "existing-id" });

			expect(await repo.findOrCreateTelemetryInstanceId()).toBe("existing-id");
		});

		it("returns null when the settings singleton does not exist", async () => {
			expect(await repo.findOrCreateTelemetryInstanceId()).toBeNull();
		});
	});

	// Each team edits its own share of the instance-wide list. The pipeline update that does it is what keeps two
	// admins saving at once from overwriting each other.
	describe("replaceTeamEgressNotifications", () => {
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
});
