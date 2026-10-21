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

	describe("egressCheckTargets", () => {
		// Stored empty so the probe falls back to whatever DEFAULT_EGRESS_TARGETS is at the time, not a copy from install day
		it("stores and returns an empty list on a new settings document", async () => {
			await repo.create({ singleton: true });

			const raw = await AppSettingsModel.findOne({ singleton: true }).lean();
			expect(raw?.egressCheckTargets).toEqual([]);
			expect((await repo.findSingleton())?.egressCheckTargets).toEqual([]);
		});

		it("returns an empty list when the stored document has no targets field", async () => {
			await AppSettingsModel.collection.insertOne({ singleton: true });

			expect((await repo.findSingleton())?.egressCheckTargets).toEqual([]);
		});
	});
});
