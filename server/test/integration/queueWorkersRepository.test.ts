import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoQueueWorkersRepository from "../../src/domain/queue-workers/queue-worker.repository.mongo.ts";
import { QueueWorkerModel } from "../../src/domain/queue-workers/queue-worker.model.ts";
import type { WorkerEgress } from "../../src/domain/queue-workers/queue-worker.type.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// The egress verdict shares a record with the heartbeat: setEgress must never create one, and the
// heartbeat upsert must never clobber it. Both rest on update semantics, so they need a live engine.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await QueueWorkerModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await QueueWorkerModel.deleteMany({});
});

const RECENT_MS = 60_000;

const makeEgress = (overrides?: Partial<WorkerEgress>): WorkerEgress => ({
	status: "degraded",
	checkedAt: 1_760_000_000_000,
	degradedSince: 1_759_999_990_000,
	lastProbeResults: [
		{ target: "https://a.test", reachable: false, responseTime: 5000, message: "timed out" },
		{ target: "https://b.test", reachable: false, responseTime: 12 },
	],
	...overrides,
});

describe("MongoQueueWorkersRepository", () => {
	const repo = new MongoQueueWorkersRepository();

	const findWorker = async (workerId: string) => (await repo.findRecent(RECENT_MS)).find((worker) => worker.workerId === workerId);

	describe("setEgress", () => {
		it("does not create a record for a worker that has not sent a heartbeat", async () => {
			await repo.setEgress("missing", makeEgress());

			expect(await QueueWorkerModel.countDocuments({ _id: "missing" })).toBe(0);
		});

		it("leaves a fresh heartbeat record without an egress verdict", async () => {
			await repo.upsert("worker-1", "worker", true);

			const raw = await QueueWorkerModel.findById("worker-1").lean();
			expect(raw).not.toHaveProperty("egress");
			expect(await findWorker("worker-1")).not.toHaveProperty("egress");
		});

		it("stores the timestamps as dates and returns the verdict as epoch ms", async () => {
			const egress = makeEgress();
			await repo.upsert("worker-1", "worker", true);

			await repo.setEgress("worker-1", egress);

			const raw = await QueueWorkerModel.findById("worker-1").lean();
			expect(raw?.egress?.checkedAt).toBeInstanceOf(Date);
			expect(raw?.egress?.degradedSince).toBeInstanceOf(Date);
			expect((await findWorker("worker-1"))?.egress).toEqual(egress);
		});

		it("keeps the verdict when the next heartbeat arrives", async () => {
			const egress = makeEgress();
			await repo.upsert("worker-1", "worker", true);
			await repo.setEgress("worker-1", egress);

			await repo.upsert("worker-1", "worker", true);

			expect((await findWorker("worker-1"))?.egress).toEqual(egress);
		});

		it("returns a null degradedSince for an ok verdict", async () => {
			await repo.upsert("worker-1", "worker", true);

			await repo.setEgress("worker-1", makeEgress({ status: "ok", degradedSince: null }));

			const worker = await findWorker("worker-1");
			expect(worker?.egress?.status).toBe("ok");
			expect(worker?.egress?.degradedSince).toBeNull();
		});

		it("rejects a status outside EgressStatuses", async () => {
			await repo.upsert("worker-1", "worker", true);

			await expect(repo.setEgress("worker-1", makeEgress({ status: "bogus" as WorkerEgress["status"] }))).rejects.toThrow();
		});
	});
});
