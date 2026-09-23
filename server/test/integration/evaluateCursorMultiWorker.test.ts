import { describe, expect, it, jest, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import MongoJobsRepository from "../../src/domain/jobs/job.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import JobModel from "../../src/domain/jobs/job.model.ts";
import { CheckService } from "../../src/domain/checks/check.service.ts";
import { BufferService } from "../../src/service/bufferService.ts";
import { DBQueueWorker } from "../../src/worker/worker.db-queue.ts";
import { WorkerPipeline } from "../../src/worker/worker.pipeline.ts";
import { InMemoryMonitorsRepository } from "../helpers/InMemoryMonitorsRepository.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";
import type { Job } from "../../src/domain/jobs/job.type.ts";
import type { Check } from "../../src/domain/checks/check.type.ts";
import type { Monitor } from "../../src/domain/monitors/monitor.type.ts";
import type { MonitorStatusResponse } from "../../src/types/network.ts";
import type { ILogger } from "../../src/utils/logger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Regression test for the dropped-check bug in the check-to-evaluate handoff.
//
// The evaluate step used to be driven by a timestamp cursor: the evaluator read checks with
// createdAt strictly after the monitor's lastEvaluatedAt and advanced that cursor to each
// check's createdAt. Each worker's BufferService flushes its own in-memory batch on its own
// timer, so with two processing workers a later check produced on worker B could be flushed and
// evaluated before an earlier check produced on worker A had been flushed. When A's batch landed,
// its check was older than the cursor and the evaluate query never returned it. The check existed
// in the collection but never reached the status window, stats, incidents or notifications.
//
// The evaluate row now carries the ids of every stored check, pushed at ingest and pulled as each
// is applied, so a late batch is always evaluated. This drives the real time-series query, the
// real jobs collection, the real buffer flush, the real pipeline ingest and evaluate stages and the
// real DBQueueWorker job path against an in-process mongod, so the handoff semantics under test
// are MongoDB's, not a mock's.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection(); // timeseries collections must exist before insert
	await JobModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await CheckModel.deleteMany({});
	await JobModel.deleteMany({});
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONITOR_ID = new mongoose.Types.ObjectId().toString();
const TEAM_ID = new mongoose.Types.ObjectId().toString();
const T0 = Date.parse("2026-01-01T00:00:00.000Z");
const INTERVAL_MS = 30_000;

const makeMonitor = (): Monitor =>
	({
		id: MONITOR_ID,
		teamId: TEAM_ID,
		type: "http",
		interval: INTERVAL_MS,
		status: "up",
		isActive: true,
		statusWindow: [],
		statusWindowSize: 5,
		statusWindowThreshold: 60,
		recentChecks: [],
		lastEvaluatedAt: 0,
	}) as unknown as Monitor;

const makeStatusResponse = (): MonitorStatusResponse => ({
	monitorId: MONITOR_ID,
	teamId: TEAM_ID,
	type: "http",
	status: true,
	code: 200,
	message: "OK",
	responseTime: 100,
});

// Production stamps createdAt at the moment the probe ran, on the producing worker; pin it so
// the two workers' checks have a known order regardless of wall clock.
const producedAt = (check: Check, at: number): Check => {
	const createdAt = new Date(at).toISOString();
	return { ...check, createdAt, updatedAt: createdAt };
};

const stubSettingsService = { getSettings: () => ({ nodeEnv: "production" }) };
const stubGeoChecksService = { createGeoChecks: jest.fn<any>().mockResolvedValue([]) };
const stubDockerLogsService = { createDockerLogs: jest.fn<any>().mockResolvedValue(0) };

describe("Evaluate cursor with more than one processing worker", () => {
	let logger: ILogger;
	let monitorsRepository: InMemoryMonitorsRepository;
	let checksRepository: MongoChecksRepository;
	let checkService: CheckService;
	let bufferA: BufferService;
	let bufferB: BufferService;
	let evaluatedCheckIds: string[];
	let evaluator: DBQueueWorker;
	let evaluatorJobsRepository: MongoJobsRepository;

	// One pipeline and BufferService per worker process, each flushing into the same collection and
	// jobs table. Only stages 2 and 3 are exercised: the status service is stubbed to record which
	// checks reached evaluation, and stage 1's network dependencies are never called.
	const createWorkerPipeline = (workerId: string) => {
		const jobsRepository = new MongoJobsRepository(workerId);
		const bufferService = new BufferService(
			logger,
			stubGeoChecksService as any,
			stubDockerLogsService as any,
			stubSettingsService as any,
			(checks): Promise<void> => pipeline.ingestChecks(checks)
		);
		const pipeline = new WorkerPipeline({
			logger,
			monitorsRepository: monitorsRepository as any,
			maintenanceWindowsRepository: { findByMonitorId: jest.fn<any>().mockResolvedValue([]) } as any,
			checksRepository,
			jobsRepository,
			checkService,
			networkService: { requestStatus: jest.fn<any>() } as any,
			proxyResolver: { resolve: jest.fn<any>() } as any,
			bufferService,
			dockerLogsService: { buildDockerLogs: jest.fn<any>() } as any,
			statusService: {
				updateMonitorStatus: async (check: Check, monitor: Monitor) => {
					evaluatedCheckIds.push(check.id);
					return { monitor, statusChanged: false, prevStatus: monitor.status, code: 200, timestamp: 0 };
				},
			} as any,
			dispatcher: { dispatch: jest.fn<any>().mockResolvedValue(undefined) } as any,
		});
		return { pipeline, bufferService, jobsRepository };
	};

	// Claim every due evaluate job and run it through the worker's real per-job path.
	const runDueEvaluateJobs = async () => {
		const jobs = await evaluatorJobsRepository.claimDueBatch("evaluate", 20, Date.now());
		const runJob = (evaluator as unknown as { runJob: (job: Job) => Promise<void> }).runJob;
		for (const job of jobs) await runJob(job);
		return jobs.length;
	};

	beforeEach(() => {
		logger = createMockLogger() as unknown as ILogger;
		monitorsRepository = new InMemoryMonitorsRepository();
		monitorsRepository.seed(makeMonitor());
		checksRepository = new MongoChecksRepository(logger);
		checkService = new CheckService(monitorsRepository, logger, checksRepository);
		evaluatedCheckIds = [];
		const workerA = createWorkerPipeline("worker-a");
		const workerB = createWorkerPipeline("worker-b");
		bufferA = workerA.bufferService;
		bufferB = workerB.bufferService;

		const unused = jest.fn<any>().mockResolvedValue(undefined);
		evaluatorJobsRepository = workerB.jobsRepository;
		evaluator = new DBQueueWorker({
			logger,
			isDbConnected: () => true,
			jobsRepository: evaluatorJobsRepository,
			monitorsRepository,
			bufferService: bufferB,
			handlers: {
				check: unused,
				evaluate: workerB.pipeline.handleEvaluate,
				"geo-check": unused,
				"cleanup-orphaned": unused,
				"cleanup-retention": unused,
				egress: unused,
			},
			queueWorkersRepository: {} as any,
			queueMode: "worker",
			queuePrimaryProcesses: true,
			workerId: "worker-b",
		});
	});

	afterEach(async () => {
		await bufferA.shutdown();
		await bufferB.shutdown();
	});

	it("evaluates every persisted check even when a later worker's batch flushes first", async () => {
		// t=0: worker A holds the check job, probes, and buffers the result. Its flush timer has not fired.
		const c1 = producedAt(checkService.toCheck(makeStatusResponse())!, T0);
		bufferA.addToBuffer(c1);

		// t=30s: worker B claims the next run of the same job, probes, and buffers the result.
		const c2 = producedAt(checkService.toCheck(makeStatusResponse())!, T0 + INTERVAL_MS);
		bufferB.addToBuffer(c2);

		// t=45s: worker B's flush timer fires first. c2 is inserted and an evaluate job is queued.
		await bufferB.flushBuffer();
		expect(await runDueEvaluateJobs()).toBe(1);
		expect(evaluatedCheckIds).toEqual([c2.id]);

		// t=60s: worker A's flush timer fires. c1 is inserted and the evaluate job is pulled due again.
		await bufferA.flushBuffer();
		expect(await runDueEvaluateJobs()).toBe(1);

		// Both checks are durably stored and visible in history.
		const stored = await CheckModel.find({ "metadata.monitorId": new mongoose.Types.ObjectId(MONITOR_ID) }).lean();
		expect(stored.map((doc) => String(doc._id)).sort()).toEqual([c1.id, c2.id].sort());

		// Every stored check must reach the evaluator exactly once.
		expect(evaluatedCheckIds).toHaveLength(2);
		expect(evaluatedCheckIds).toContain(c1.id);
	});
});
