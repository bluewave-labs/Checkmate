import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as nodeCrypto from "node:crypto";
import { MonitorModel } from "../../src/domain/monitors/monitor.model.ts";
import { TeamModel } from "../../src/domain/teams/team.model.ts";
import MongoTeamsRepository from "../../src/domain/teams/team.repository.model.ts";
import { EncryptionService } from "../../src/service/encryption/encryptionService.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import JobModel, { type JobDocument } from "../../src/domain/jobs/job.model.ts";
import MongoMonitorsRepository from "../../src/domain/monitors/monitor.repository.mongo.ts";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import MongoJobsRepository from "../../src/domain/jobs/job.repository.mongo.ts";
import MongoMaintenanceWindowsRepository from "../../src/domain/maintenance-windows/maintenance-window.repository.mongo.ts";
import { CheckService } from "../../src/domain/checks/check.service.ts";
import { HeartbeatService } from "../../src/domain/heartbeat/heartbeat.service.ts";
import HeartbeatController from "../../src/api/controllers/heartbeatController.ts";
import { heartbeatRoutes } from "../../src/api/routes/heartbeatRoutes.ts";
import { buildRouter } from "../../src/api/routes/buildRouter.ts";
import { handleErrors } from "../../src/api/middleware/handleErrors.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";
import type { ILogger } from "../../src/utils/logger/logger.ts";
import type { IJobScheduler } from "../../src/worker/worker.interface.ts";

// ── Real-Mongo + real-Express harness ─────────────────────────────────────────
// The ping path is route → controller → service → repositories, with no worker involved.
// We boot it against a throwaway mongod and hit it over HTTP the way a cron job would.

const KEY = "integration-key-0123456789abcdef";
const SLUG = "cron";
let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await Promise.all([MonitorModel.init(), CheckModel.init(), JobModel.init(), TeamModel.init()]);
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await Promise.all([MonitorModel.deleteMany({}), CheckModel.deleteMany({}), JobModel.deleteMany({}), TeamModel.deleteMany({})]);
});

const setup = async () => {
	const logger = createMockLogger() as unknown as ILogger;
	const monitorsRepository = new MongoMonitorsRepository();
	const encryptionService = new EncryptionService([], logger, nodeCrypto); // hash needs no ENCRYPTION_KEY
	const service = new HeartbeatService({
		logger,
		teamsRepository: new MongoTeamsRepository(),
		encryptionService,
		monitorsRepository,
		maintenanceWindowsRepository: new MongoMaintenanceWindowsRepository(),
		jobsRepository: new MongoJobsRepository("worker-under-test"),
		checkService: new CheckService(monitorsRepository, logger, new MongoChecksRepository(logger)),
		scheduler: { wake: jest.fn() } as unknown as IJobScheduler,
	});

	const team = await TeamModel.create({ email: "team@example.com", heartbeatKeyHash: encryptionService.hash(KEY) });
	const monitor = await MonitorModel.create({
		userId: new mongoose.Types.ObjectId(),
		teamId: team._id,
		name: "cron",
		type: "heartbeat",
		interval: 60_000,
		heartbeatSlug: SLUG,
	});
	const monitorId = monitor._id.toString();
	await JobModel.create({
		_id: `check:${monitorId}`,
		type: "check",
		refId: monitorId,
		isActive: true,
		nextScheduledAt: 0,
		intervalMs: 60_000,
		lockedBy: null,
		lockedUntil: null,
		runCount: 0,
		failCount: 0,
		lastFinishedAt: null,
		lastFailReason: null,
	});

	const app = express();
	app.use(express.json());
	const noAuth = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
	app.use("/api/v1/heartbeat", buildRouter(heartbeatRoutes, new HeartbeatController(service), { jwt: noAuth, statusPage: noAuth }));
	app.use(handleErrors(logger));
	const server = app.listen(0);
	await new Promise((resolve) => server.once("listening", resolve));
	const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/heartbeat`;
	const close = () => new Promise((resolve) => server.close(resolve));
	const checksFor = () => CheckModel.find({ "metadata.monitorId": monitorId }).lean();
	return { monitorId, base, close, checksFor };
};

describe("heartbeat ping endpoint", () => {
	it("records an up check, pushes the deadline back and queues evaluation on a bodyless POST", async () => {
		const { monitorId, base, close, checksFor } = await setup();
		try {
			const before = Date.now();
			const response = await fetch(`${base}/${KEY}/${SLUG}`, { method: "POST" });

			expect(response.status).toBe(200);
			expect(await response.json()).toMatchObject({ success: true, data: { received: true } });
			const checks = await checksFor();
			expect(checks).toHaveLength(1);
			expect(checks[0]).toMatchObject({ status: true, statusCode: 200, message: "Ping received" });
			const job = await JobModel.findById(`check:${monitorId}`).lean<JobDocument>();
			expect(job?.nextScheduledAt).toBeGreaterThanOrEqual(before + 60_000);
			const evaluate = await JobModel.findById(`evaluate:${monitorId}`).lean<JobDocument>();
			expect(evaluate?.pendingChecks).toHaveLength(1);
		} finally {
			await close();
		}
	});

	it("records a non-zero exit code as down", async () => {
		const { base, close, checksFor } = await setup();
		try {
			const response = await fetch(`${base}/${KEY}/${SLUG}/1`);

			expect(response.status).toBe(200);
			const checks = await checksFor();
			expect(checks[0]).toMatchObject({ status: false, statusCode: 500, message: "Exited with code 1" });
		} finally {
			await close();
		}
	});

	it("records a reported failure with the client message", async () => {
		const { base, close, checksFor } = await setup();
		try {
			await fetch(`${base}/${KEY}/${SLUG}/fail?msg=disk%20full`);

			const checks = await checksFor();
			expect(checks[0]).toMatchObject({ status: false, message: "disk full" });
		} finally {
			await close();
		}
	});

	it("stores a reported duration as the response time", async () => {
		const { base, close, checksFor } = await setup();
		try {
			await fetch(`${base}/${KEY}/${SLUG}/0?duration=1234`);

			const checks = await checksFor();
			expect(checks[0]).toMatchObject({ status: true, responseTime: 1234 });
		} finally {
			await close();
		}
	});

	it("defaults the response time to 0 without a duration", async () => {
		const { base, close, checksFor } = await setup();
		try {
			await fetch(`${base}/${KEY}/${SLUG}`);

			const checks = await checksFor();
			expect(checks[0]).toMatchObject({ responseTime: 0 });
		} finally {
			await close();
		}
	});

	it("rejects an invalid duration with a 400 and writes nothing", async () => {
		const { base, close, checksFor } = await setup();
		try {
			for (const duration of ["-1", "1.5", "abc", "604800001"]) {
				const response = await fetch(`${base}/${KEY}/${SLUG}?duration=${duration}`);
				expect(response.status).toBe(400);
			}
			expect(await checksFor()).toHaveLength(0);
		} finally {
			await close();
		}
	});

	it("answers an unknown key with a 404 and writes nothing", async () => {
		const { base, close, checksFor } = await setup();
		try {
			const response = await fetch(`${base}/unknown-key-0000000/${SLUG}`);

			expect(response.status).toBe(404);
			expect(await response.json()).toMatchObject({ status: 404, msg: "No heartbeat monitor for this key and slug" });
			expect(await checksFor()).toHaveLength(0);
		} finally {
			await close();
		}
	});

	it("answers an unknown slug with the same 404 and writes nothing", async () => {
		const { base, close, checksFor } = await setup();
		try {
			const response = await fetch(`${base}/${KEY}/unknown-slug`);

			expect(response.status).toBe(404);
			expect(await response.json()).toMatchObject({ status: 404, msg: "No heartbeat monitor for this key and slug" });
			expect(await checksFor()).toHaveLength(0);
		} finally {
			await close();
		}
	});

	it("doesn't reach another team's monitor with the same slug", async () => {
		const { base, close } = await setup();
		try {
			const otherTeam = await TeamModel.create({ email: "other@example.com" });
			const other = await MonitorModel.create({
				userId: new mongoose.Types.ObjectId(),
				teamId: otherTeam._id,
				name: "other",
				type: "heartbeat",
				interval: 60_000,
				heartbeatSlug: "other-cron",
			});

			const response = await fetch(`${base}/${KEY}/other-cron`);

			expect(response.status).toBe(404);
			expect(await CheckModel.countDocuments({ "metadata.monitorId": other._id })).toBe(0);
		} finally {
			await close();
		}
	});

	it("rejects a malformed slug with a 400 and writes nothing", async () => {
		const { base, close, checksFor } = await setup();
		try {
			const response = await fetch(`${base}/${KEY}/Not_A_Slug`);

			expect(response.status).toBe(400);
			expect(await checksFor()).toHaveLength(0);
		} finally {
			await close();
		}
	});

	it("rejects an exit code above 255 with a 400 and writes nothing", async () => {
		const { base, close, checksFor } = await setup();
		try {
			const response = await fetch(`${base}/${KEY}/${SLUG}/256`);

			expect(response.status).toBe(400);
			expect(await checksFor()).toHaveLength(0);
		} finally {
			await close();
		}
	});
});
