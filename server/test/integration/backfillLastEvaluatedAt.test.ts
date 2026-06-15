import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MonitorModel } from "../../src/domain/monitors/monitor.model.ts";
import { backfillMonitorLastEvaluatedAt } from "../../src/db/migration/0008_backfillMonitorLastEvaluatedAt.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Legacy monitors are inserted through the raw driver, NOT MonitorModel.create — the
// schema default (lastEvaluatedAt: 0) would otherwise stamp the field and the migration's
// { $exists: false } filter would skip it, defeating the test.

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
	await MonitorModel.collection.deleteMany({});
});

describe("0008_backfillMonitorLastEvaluatedAt", () => {
	it("stamps the upgrade moment (not 0) on monitors missing lastEvaluatedAt", async () => {
		await MonitorModel.collection.insertOne({ name: "legacy" }); // pre-upgrade doc, no lastEvaluatedAt

		const before = Date.now();
		await backfillMonitorLastEvaluatedAt();

		const doc = await MonitorModel.collection.findOne({ name: "legacy" });
		// Must be a recent timestamp — backfilling 0 would replay the whole check history on the first evaluate.
		expect(doc?.lastEvaluatedAt).not.toBe(0);
		expect(doc?.lastEvaluatedAt).toBeGreaterThanOrEqual(before);
		expect(doc?.lastEvaluatedAt).toBeLessThanOrEqual(Date.now());
	});

	it("leaves monitors that already have lastEvaluatedAt untouched (idempotent)", async () => {
		await MonitorModel.collection.insertOne({ name: "current", lastEvaluatedAt: 12345 });

		await backfillMonitorLastEvaluatedAt();

		const doc = await MonitorModel.collection.findOne({ name: "current" });
		expect(doc?.lastEvaluatedAt).toBe(12345);
	});
});
