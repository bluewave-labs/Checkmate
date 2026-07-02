import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { JobScheduler } from "../../src/worker/worker.job-scheduler.ts";
import MongoJobsRepository from "../../src/domain/jobs/job.repository.mongo.ts";
import MongoQueueWorkersRepository from "../../src/domain/queue-workers/queue-worker.repository.mongo.ts";
import MongoMonitorsRepository from "../../src/domain/monitors/monitor.repository.mongo.ts";
import JobModel, { type JobDocument } from "../../src/domain/jobs/job.model.ts";
import { MonitorModel } from "../../src/domain/monitors/monitor.model.ts";
import { QueueWorkerModel } from "../../src/domain/queue-workers/queue-worker.model.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The bug: a scheduler-only primary (queueMode=primary, queuePrimaryProcesses=false)
// never seeded the jobs collection, so a fresh start with existing monitors left the
// workers idle. The fix moved reconcile/heartbeat onto the base JobScheduler.init().
// This proves init() against a live mongod actually writes the expected job rows.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await JobModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await JobModel.deleteMany({});
	await MonitorModel.collection.deleteMany({});
	await QueueWorkerModel.deleteMany({});
});

const WORKER_ID = "scheduler-primary-1";

const seedMonitor = (overrides: Record<string, unknown> = {}) =>
	MonitorModel.create({
		userId: new mongoose.Types.ObjectId(),
		teamId: new mongoose.Types.ObjectId(),
		name: "mon",
		type: "http",
		url: "https://example.com",
		interval: 60_000,
		isActive: true,
		...overrides,
	});

const makeScheduler = () =>
	new JobScheduler(
		new MongoJobsRepository(WORKER_ID),
		new MongoQueueWorkersRepository(),
		new MongoMonitorsRepository(),
		"primary",
		createMockLogger(),
		WORKER_ID
	);

const idsOf = async () => (await JobModel.find().lean<JobDocument[]>()).map((j) => j._id);

describe("JobScheduler.init (scheduler-only primary reconcile)", () => {
	it("seeds a check row per monitor plus the two cleanup rows", async () => {
		const m1 = await seedMonitor();
		const m2 = await seedMonitor({ name: "mon-2" });

		const scheduler = makeScheduler();
		await scheduler.init();
		await scheduler.shutdown(); // stop the heartbeat interval

		const ids = await idsOf();
		expect(ids).toContain(`check:${m1.id}`);
		expect(ids).toContain(`check:${m2.id}`);
		expect(ids).toContain("cleanup-orphaned");
		expect(ids).toContain("cleanup-retention");
	});

	it("seeds a geo-check row only for geo-enabled monitors", async () => {
		const geo = await seedMonitor({ name: "geo", geoCheckEnabled: true });
		const plain = await seedMonitor({ name: "plain", geoCheckEnabled: false });

		const scheduler = makeScheduler();
		await scheduler.init();
		await scheduler.shutdown();

		const ids = await idsOf();
		expect(ids).toContain(`geo-check:${geo.id}`);
		expect(ids).not.toContain(`geo-check:${plain.id}`);
	});

	it("registers the primary in the queue_workers registry", async () => {
		await seedMonitor();

		const scheduler = makeScheduler();
		await scheduler.init();
		await scheduler.shutdown();

		// shutdown deregisters, so assert mid-flight: re-init then read before shutdown.
		const scheduler2 = makeScheduler();
		await scheduler2.init();
		const row = await QueueWorkerModel.findById(WORKER_ID).lean();
		expect(row?.mode).toBe("primary");
		await scheduler2.shutdown();
	});
});
