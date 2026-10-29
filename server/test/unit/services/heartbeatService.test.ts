import { describe, expect, it, jest } from "@jest/globals";
import { HeartbeatService } from "../../../src/domain/heartbeat/heartbeat.service.ts";
import { heartbeatErrors } from "../../../src/domain/heartbeat/heartbeat.errors.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { MaintenanceWindow } from "../../../src/domain/maintenance-windows/maintenance-window.type.ts";
import type { Check } from "../../../src/domain/checks/check.type.ts";
import type { IMonitorsRepository } from "../../../src/domain/monitors/monitor.repository.interface.ts";
import type { IMaintenanceWindowsRepository } from "../../../src/domain/maintenance-windows/maintenance-window.repository.interface.ts";
import type { IJobsRepository } from "../../../src/domain/jobs/job.repository.interface.ts";
import type { ICheckService } from "../../../src/domain/checks/check.service.ts";
import type { IJobScheduler } from "../../../src/worker/worker.interface.ts";
import type { ITeamsRepository } from "../../../src/domain/teams/team.repository.interface.ts";
import type { IEncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import type { Team } from "../../../src/domain/teams/team.type.ts";
import type { ILogger } from "../../../src/utils/logger/logger.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({ id: "mon-1", teamId: "team-1", type: "heartbeat", isActive: true, interval: 60_000, ...overrides }) as Monitor;

// A window straddling "now", active per isWindowActive
const activeWindow = (): MaintenanceWindow =>
	({
		id: "mw-1",
		active: true,
		repeat: 0,
		start: new Date(Date.now() - 60_000).toISOString(),
		end: new Date(Date.now() + 60_000).toISOString(),
	}) as MaintenanceWindow;

const setup = (opts?: { team?: Team | null; monitor?: Monitor | null; windows?: MaintenanceWindow[] }) => {
	const teamsRepository = {
		findByHeartbeatKeyHash: jest.fn<any>().mockResolvedValue(opts?.team === undefined ? ({ id: "team-1" } as Team) : opts.team),
	} as unknown as jest.Mocked<ITeamsRepository>;
	const encryptionService = {
		hash: jest.fn((value: string) => `hash(${value})`),
	} as unknown as jest.Mocked<IEncryptionService>;
	const monitorsRepository = {
		findHeartbeatBySlug: jest.fn<any>().mockResolvedValue(opts?.monitor === undefined ? makeMonitor() : opts.monitor),
	} as unknown as jest.Mocked<IMonitorsRepository>;
	const maintenanceWindowsRepository = {
		findByMonitorId: jest.fn<any>().mockResolvedValue(opts?.windows ?? []),
	} as unknown as jest.Mocked<IMaintenanceWindowsRepository>;
	const jobsRepository = {
		rescheduleChecks: jest.fn<any>().mockResolvedValue(1),
		upsertEvaluate: jest.fn<any>().mockResolvedValue(true),
	} as unknown as jest.Mocked<IJobsRepository>;
	const checkService = {
		toCheck: jest.fn((s: { status: boolean; code: number; message: string }) => ({
			id: "chk-1",
			createdAt: new Date().toISOString(),
			status: s.status,
			statusCode: s.code,
			message: s.message,
		})) as unknown as ICheckService["toCheck"],
		createChecks: jest.fn<any>().mockResolvedValue([]),
	} as unknown as jest.Mocked<ICheckService>;
	const scheduler = { wake: jest.fn() } as unknown as jest.Mocked<IJobScheduler>;
	const service = new HeartbeatService({
		logger: createMockLogger() as unknown as ILogger,
		teamsRepository,
		encryptionService,
		monitorsRepository,
		maintenanceWindowsRepository,
		jobsRepository,
		checkService,
		scheduler,
	});
	return { service, teamsRepository, encryptionService, monitorsRepository, maintenanceWindowsRepository, jobsRepository, checkService, scheduler };
};

const createdCheck = (checkService: jest.Mocked<ICheckService>) => (checkService.createChecks.mock.calls[0]?.[0] as Check[])[0];

// ── Tests ────────────────────────────────────────────────────────────────────

describe("HeartbeatService.recordPing", () => {
	it("looks up the team by the key's hash and the monitor by slug within that team", async () => {
		const { service, teamsRepository, encryptionService, monitorsRepository } = setup();

		await service.recordPing({ pingKey: "k", slug: "s", action: "success" });

		expect(encryptionService.hash).toHaveBeenCalledWith("k");
		expect(teamsRepository.findByHeartbeatKeyHash).toHaveBeenCalledWith("hash(k)");
		expect(monitorsRepository.findHeartbeatBySlug).toHaveBeenCalledWith("team-1", "s");
	});

	it("rejects an unknown key without looking up a monitor or touching the job row", async () => {
		const { service, monitorsRepository, jobsRepository } = setup({ team: null });

		await expect(service.recordPing({ pingKey: "k", slug: "s", action: "success" })).rejects.toMatchObject({ definition: heartbeatErrors.notFound });
		expect(monitorsRepository.findHeartbeatBySlug).not.toHaveBeenCalled();
		expect(jobsRepository.rescheduleChecks).not.toHaveBeenCalled();
	});

	it("rejects an unknown slug without touching the job row", async () => {
		const { service, jobsRepository } = setup({ monitor: null });

		await expect(service.recordPing({ pingKey: "k", slug: "s", action: "success" })).rejects.toMatchObject({ definition: heartbeatErrors.notFound });
		expect(jobsRepository.rescheduleChecks).not.toHaveBeenCalled();
	});

	it("ignores a ping for a paused monitor", async () => {
		const { service, jobsRepository, checkService, scheduler } = setup({ monitor: makeMonitor({ isActive: false }) });

		await service.recordPing({ pingKey: "k", slug: "s", action: "success" });

		expect(jobsRepository.rescheduleChecks).not.toHaveBeenCalled();
		expect(checkService.createChecks).not.toHaveBeenCalled();
		expect(jobsRepository.upsertEvaluate).not.toHaveBeenCalled();
		expect(scheduler.wake).not.toHaveBeenCalled();
	});

	it("pushes the deadline back during maintenance but records no check", async () => {
		const { service, jobsRepository, checkService, scheduler } = setup({ windows: [activeWindow()] });

		await service.recordPing({ pingKey: "k", slug: "s", action: "success" });

		expect(jobsRepository.rescheduleChecks).toHaveBeenCalledWith(["mon-1"], expect.any(Number));
		expect(checkService.toCheck).not.toHaveBeenCalled();
		expect(checkService.createChecks).not.toHaveBeenCalled();
		expect(jobsRepository.upsertEvaluate).not.toHaveBeenCalled();
		expect(scheduler.wake).not.toHaveBeenCalled();
	});

	it("pushes the deadline back, stores an up check and queues it for evaluation", async () => {
		const { service, jobsRepository, checkService, scheduler } = setup();

		await service.recordPing({ pingKey: "k", slug: "s", action: "success" });

		expect(jobsRepository.rescheduleChecks).toHaveBeenCalledWith(["mon-1"], expect.any(Number));
		expect(checkService.toCheck).toHaveBeenCalledWith(expect.objectContaining({ type: "heartbeat", responseTime: 0 }));
		expect(createdCheck(checkService)).toMatchObject({ status: true, statusCode: 200, message: "Ping received" });
		expect(jobsRepository.upsertEvaluate).toHaveBeenCalledWith("mon-1", [{ checkId: "chk-1", createdAt: expect.any(Number) }], expect.any(Number));
		expect(scheduler.wake).toHaveBeenCalledWith("evaluate");
	});

	it("records a reported failure as down", async () => {
		const { service, checkService } = setup();

		await service.recordPing({ pingKey: "k", slug: "s", action: "fail" });

		expect(createdCheck(checkService)).toMatchObject({ status: false, statusCode: 500, message: "Reported failure" });
	});

	it("records a non-zero exit code as down with the code in the message", async () => {
		const { service, checkService } = setup();

		await service.recordPing({ pingKey: "k", slug: "s", action: "fail", exitCode: 3 });

		expect(createdCheck(checkService)).toMatchObject({ status: false, statusCode: 500, message: "Exited with code 3" });
	});

	it("records exit code 0 as up", async () => {
		const { service, checkService } = setup();

		await service.recordPing({ pingKey: "k", slug: "s", action: "success", exitCode: 0 });

		expect(createdCheck(checkService)).toMatchObject({ status: true, statusCode: 200, message: "Ping received" });
	});

	it("stores a reported duration as the response time", async () => {
		const { service, checkService } = setup();

		await service.recordPing({ pingKey: "k", slug: "s", action: "success", duration: 1234 });

		expect(checkService.toCheck).toHaveBeenCalledWith(expect.objectContaining({ responseTime: 1234 }));
	});

	it("uses a client message, and falls back to the default for an empty one", async () => {
		const withMessage = setup();
		await withMessage.service.recordPing({ pingKey: "k", slug: "s", action: "success", message: "backup ok" });
		expect(createdCheck(withMessage.checkService)).toMatchObject({ message: "backup ok" });

		const emptyMessage = setup();
		await emptyMessage.service.recordPing({ pingKey: "k", slug: "s", action: "success", message: "" });
		expect(createdCheck(emptyMessage.checkService)).toMatchObject({ message: "Ping received" });
	});
});
