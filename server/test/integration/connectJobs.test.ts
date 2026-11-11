import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoJobsRepository from "../../src/domain/jobs/job.repository.mongo.ts";
import JobModel from "../../src/domain/jobs/job.model.ts";
import { PARKED, type Job } from "../../src/domain/jobs/job.type.ts";
import MongoConnectRepository from "../../src/domain/connect/connect.repository.mongo.ts";
import { ConnectStateModel } from "../../src/domain/connect/connect.model.ts";
import { ConnectOperationService } from "../../src/domain/connect/connect-operation.service.ts";
import type { ConnectBackupResult } from "../../src/domain/connect/connect-backup.type.ts";
import { EncryptionService } from "../../src/service/encryption/encryptionService.ts";
import { JobScheduler } from "../../src/worker/worker.job-scheduler.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await JobModel.init();
	await ConnectStateModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await JobModel.deleteMany({});
	await ConnectStateModel.deleteMany({});
});

const encryptionService = new EncryptionService([nodeCrypto.randomBytes(32)], createMockLogger() as any, nodeCrypto);
const connectRepository = new MongoConnectRepository();

const result = (): ConnectBackupResult => ({
	ok: true,
	at: new Date(),
	kind: "full",
	sizeBytes: 10,
	sha256: "ab".repeat(32),
	backupId: "b-1",
	durationMs: 1,
	error: null,
});

const makeWorker = (workerId: string, opts: { hasTool?: boolean; elsewhere?: boolean } = {}) => {
	const jobsRepository = new MongoJobsRepository(workerId);
	const connectBackupService = { backup: jest.fn<any>(async () => result()) };
	const connectToolsService = {
		report: jest.fn<any>(),
		hasTool: jest.fn(() => opts.hasTool ?? true),
		isAvailableOnAnotherWorker: jest.fn<any>().mockResolvedValue(opts.elsewhere ?? false),
	};
	const job = new ConnectOperationService(connectRepository, encryptionService, connectBackupService, connectToolsService, createMockLogger() as any);
	const claim = async () => (await jobsRepository.claimDueBatch("connect-operation", 1, Date.now()))[0] ?? null;
	const finish = async (claimed: Job) => {
		try {
			await job.handleJob();
			await jobsRepository.recordOneShot(claimed.id, claimed.nextScheduledAt, Date.now());
		} catch (error: unknown) {
			await jobsRepository.recordFailure(claimed.id, error, Date.now());
		}
	};
	const runOnce = async () => {
		const claimed = await claim();
		if (!claimed) return false;
		await finish(claimed);
		return true;
	};
	return { jobsRepository, connectBackupService, job, claim, finish, runOnce };
};

const apiScheduler = () => new JobScheduler(new MongoJobsRepository("api"), {} as any, {} as any, "primary", createMockLogger() as any, "api", false);

const queueBackup = async () => {
	await connectRepository.setEnrollment({
		connectUrl: "wss://relay.checkmate.so/api/tunnel",
		agentId: "inst-1",
		token: encryptionService.encrypt(`cmk_${"a".repeat(48)}`),
		apiUrl: null,
	});
	await connectRepository.setRecoveryKeyIfUnset(encryptionService.encrypt("ab".repeat(32)));
	await connectRepository.requestOperation({
		type: "backup",
		kind: "full",
		requestedAt: new Date(),
		startedAt: null,
	});
	await apiScheduler().addGlobalJob("connect-operation");
};

const readRow = () => JobModel.findById("connect-operation").lean();

describe("connect-operation across workers", () => {
	it("runs a queued backup once with two workers and parks the row", async () => {
		const a = makeWorker("worker-a");
		const b = makeWorker("worker-b");
		await queueBackup();

		const ran = await Promise.all([a.runOnce(), b.runOnce()]);

		expect(ran.filter(Boolean)).toHaveLength(1);
		expect(a.connectBackupService.backup.mock.calls.length + b.connectBackupService.backup.mock.calls.length).toBe(1);
		expect((await readRow())?.nextScheduledAt).toBe(PARKED);
		const state = await connectRepository.get();
		expect(state.operation).toBeNull();
		expect(state.lastBackup?.ok).toBe(true);
	});

	it("re-runs the operation on another worker when the first dies mid-run", async () => {
		const a = makeWorker("worker-a");
		const b = makeWorker("worker-b");
		await queueBackup();

		expect(await a.claim()).not.toBeNull();
		await connectRepository.markOperationStarted(new Date());
		await JobModel.updateOne({ _id: "connect-operation" }, { $set: { lockedUntil: Date.now() - 1 } });

		expect(await b.runOnce()).toBe(true);
		expect(b.connectBackupService.backup).toHaveBeenCalledTimes(1);
		expect((await connectRepository.get()).operation).toBeNull();
	});

	it("hands a backup to a worker that has mongodump", async () => {
		const a = makeWorker("worker-a", { hasTool: false, elsewhere: true });
		const b = makeWorker("worker-b");
		await queueBackup();

		expect(await a.runOnce()).toBe(true);
		const row = await readRow();
		expect(row?.lockedBy).toBeNull();
		expect(row?.nextScheduledAt).toBeGreaterThan(Date.now());
		expect((await connectRepository.get()).operation).not.toBeNull();

		await JobModel.updateOne({ _id: "connect-operation" }, { $set: { nextScheduledAt: Date.now() } });
		expect(await b.runOnce()).toBe(true);
		expect(a.connectBackupService.backup).not.toHaveBeenCalled();
		expect(b.connectBackupService.backup).toHaveBeenCalledTimes(1);
	});

	it("keeps the row armed when the API queues a backup as a run finishes", async () => {
		const a = makeWorker("worker-a");
		await queueBackup();
		const claimed = await a.claim();
		expect(claimed).not.toBeNull();

		await a.job.handleJob();
		await connectRepository.requestOperation({
			type: "backup",
			kind: "config",
			requestedAt: new Date(),
			startedAt: null,
		});
		await apiScheduler().addGlobalJob("connect-operation");
		await a.jobsRepository.recordOneShot(claimed!.id, claimed!.nextScheduledAt, Date.now());

		expect((await readRow())?.nextScheduledAt).not.toBe(PARKED);
		expect(await a.runOnce()).toBe(true);
		expect(a.connectBackupService.backup).toHaveBeenCalledTimes(2);
	});
});
