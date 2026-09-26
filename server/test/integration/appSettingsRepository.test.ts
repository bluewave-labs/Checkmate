import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoAppSettingsRepository from "../../src/domain/app-settings/app-settings.repository.mongo.ts";
import { AppSettingsModel } from "../../src/domain/app-settings/app-settings.model.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Outgoing alert emails are built from whatever the repository mapper returns. A
// field the schema stores but the mapper drops silently disappears from every real
// send while still working in the test-email path, so read settings back through
// the real repository rather than a mock.

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

describe("MongoAppSettingsRepository", () => {
	it("returns the system email display name from findSingleton", async () => {
		const repo = new MongoAppSettingsRepository();
		await AppSettingsModel.create({
			singleton: true,
			systemEmailAddress: "alerts@example.com",
			systemEmailDisplayName: "Checkmate Alerts",
		});

		const settings = await repo.findSingleton();

		expect(settings).toMatchObject({
			systemEmailAddress: "alerts@example.com",
			systemEmailDisplayName: "Checkmate Alerts",
		});
	});
});
