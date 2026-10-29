import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as nodeCrypto from "node:crypto";
import { MonitorModel } from "../../src/domain/monitors/monitor.model.ts";
import { TeamModel } from "../../src/domain/teams/team.model.ts";
import { UserModel } from "../../src/domain/users/user.model.ts";
import MongoUsersRepository from "../../src/domain/users/user.repository.mongo.ts";
import { MonitorService } from "../../src/domain/monitors/monitor.service.ts";
import { HEARTBEAT_DEFAULT_INTERVAL_MS } from "../../src/domain/heartbeat/heartbeat.type.ts";
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
	await Promise.all([MonitorModel.init(), CheckModel.init(), JobModel.init(), TeamModel.init(), UserModel.init()]);
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await Promise.all([
		MonitorModel.deleteMany({}),
		CheckModel.deleteMany({}),
		JobModel.deleteMany({}),
		TeamModel.deleteMany({}),
		UserModel.deleteMany({}),
	]);
});

const setup = async () => {
	const logger = createMockLogger() as unknown as ILogger;
	const monitorsRepository = new MongoMonitorsRepository();
	const encryptionService = new EncryptionService([], logger, nodeCrypto); // hash needs no ENCRYPTION_KEY
	const scheduler = { wake: jest.fn(), addJob: jest.fn<any>().mockResolvedValue(undefined) } as unknown as IJobScheduler;
	const unused = {} as never;
	const monitorService = new MonitorService({
		scheduler,
		logger,
		games: unused,
		monitorsRepository,
		checksRepository: unused,
		geoChecksRepository: unused,
		dockerLogsRepository: unused,
		monitorStatsRepository: unused,
		statusPagesRepository: unused,
		incidentsRepository: unused,
		encryptionService,
	});
	const service = new HeartbeatService({
		logger,
		teamsRepository: new MongoTeamsRepository(),
		encryptionService,
		monitorsRepository,
		maintenanceWindowsRepository: new MongoMaintenanceWindowsRepository(),
		jobsRepository: new MongoJobsRepository("worker-under-test"),
		checkService: new CheckService(monitorsRepository, logger, new MongoChecksRepository(logger)),
		scheduler,
		usersRepository: new MongoUsersRepository(),
		monitorService,
	});

	const teamId = new mongoose.Types.ObjectId();
	const admin = await UserModel.create({
		firstName: "Ada",
		lastName: "Admin",
		email: "admin@example.com",
		password: "not-used",
		role: ["admin"],
		teamId,
	});
	const team = await TeamModel.create({
		_id: teamId,
		email: "team@example.com",
		heartbeatKeyHash: encryptionService.hash(KEY),
		heartbeatKeyCreatedBy: admin._id,
	});
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
	return { monitorId, adminId: admin._id.toString(), teamId, base, close, checksFor };
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

	describe("with create=true", () => {
		const heartbeatsFor = (teamId: mongoose.Types.ObjectId, heartbeatSlug: string) => MonitorModel.find({ teamId, heartbeatSlug }).lean();
		const checksOf = (monitorId: mongoose.Types.ObjectId) => CheckModel.find({ "metadata.monitorId": monitorId }).lean();

		it("creates the monitor owned by the key creator and records an up check", async () => {
			const { base, adminId, teamId, close } = await setup();
			try {
				const response = await fetch(`${base}/${KEY}/backup?create=true`);

				expect(response.status).toBe(200);
				const [created] = await heartbeatsFor(teamId, "backup");
				expect(created).toMatchObject({ type: "heartbeat", name: "backup", interval: HEARTBEAT_DEFAULT_INTERVAL_MS, url: "", isActive: true });
				expect(created?.userId.toString()).toBe(adminId);
				expect(await checksOf(created!._id)).toEqual([expect.objectContaining({ status: true })]);
			} finally {
				await close();
			}
		});

		it("reuses the monitor on the next ping", async () => {
			const { base, teamId, close } = await setup();
			try {
				await fetch(`${base}/${KEY}/backup?create=true`);
				await fetch(`${base}/${KEY}/backup?create=true`);

				const monitors = await heartbeatsFor(teamId, "backup");
				expect(monitors).toHaveLength(1);
				expect(await checksOf(monitors[0]!._id)).toHaveLength(2);
			} finally {
				await close();
			}
		});

		it("uses the requested interval", async () => {
			const { base, teamId, close } = await setup();
			try {
				await fetch(`${base}/${KEY}/backup?create=true&interval=3600000`);

				expect((await heartbeatsFor(teamId, "backup"))[0]).toMatchObject({ interval: 3_600_000 });
			} finally {
				await close();
			}
		});

		it("records a down check when created by a failing exit code", async () => {
			const { base, teamId, close } = await setup();
			try {
				await fetch(`${base}/${KEY}/backup/1?create=true`);

				const [created] = await heartbeatsFor(teamId, "backup");
				expect(await checksOf(created!._id)).toEqual([expect.objectContaining({ status: false })]);
			} finally {
				await close();
			}
		});

		it("creates exactly one monitor for concurrent first pings", async () => {
			const { base, teamId, close } = await setup();
			try {
				const statuses = await Promise.all([1, 2].map(() => fetch(`${base}/${KEY}/backup?create=true`).then((r) => r.status)));

				expect(statuses).toEqual([200, 200]);
				const monitors = await heartbeatsFor(teamId, "backup");
				expect(monitors).toHaveLength(1);
				expect(await checksOf(monitors[0]!._id)).toHaveLength(2);
			} finally {
				await close();
			}
		});

		it.each([
			["no create", ""],
			["create=false", "?create=false"],
		])("answers an unknown slug with 404 and creates nothing with %s", async (_label, query) => {
			const { base, teamId, close } = await setup();
			try {
				const response = await fetch(`${base}/${KEY}/backup${query}`);

				expect(response.status).toBe(404);
				expect(await heartbeatsFor(teamId, "backup")).toHaveLength(0);
			} finally {
				await close();
			}
		});

		it("creates nothing for a wrong key", async () => {
			const { base, close } = await setup();
			try {
				const response = await fetch(`${base}/unknown-key-0000000/backup?create=true`);

				expect(response.status).toBe(404);
				expect(await MonitorModel.countDocuments({ heartbeatSlug: "backup" })).toBe(0);
			} finally {
				await close();
			}
		});

		it.each([["create=yes"], ["create=true&interval=5000"]])("rejects %s with a 400", async (query) => {
			const { base, teamId, close } = await setup();
			try {
				const response = await fetch(`${base}/${KEY}/backup?${query}`);

				expect(response.status).toBe(400);
				expect(await heartbeatsFor(teamId, "backup")).toHaveLength(0);
			} finally {
				await close();
			}
		});
	});
});
