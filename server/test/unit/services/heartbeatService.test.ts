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

const setup = (opts?: { monitor?: Monitor | null; windows?: MaintenanceWindow[] }) => {
	const monitorsRepository = {
		findByHeartbeatToken: jest.fn<any>().mockResolvedValue(opts?.monitor === undefined ? makeMonitor() : opts.monitor),
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
		monitorsRepository,
		maintenanceWindowsRepository,
		jobsRepository,
		checkService,
		scheduler,
	});
	return { service, monitorsRepository, maintenanceWindowsRepository, jobsRepository, checkService, scheduler };
};

const createdCheck = (checkService: jest.Mocked<ICheckService>) => (checkService.createChecks.mock.calls[0]?.[0] as Check[])[0];

// ── Tests ────────────────────────────────────────────────────────────────────

describe("HeartbeatService.recordPing", () => {
	it("rejects an unknown token without touching the job row", async () => {
		const { service, jobsRepository } = setup({ monitor: null });

		await expect(service.recordPing({ token: "t", action: "success" })).rejects.toMatchObject({ definition: heartbeatErrors.notFound });
		expect(jobsRepository.rescheduleChecks).not.toHaveBeenCalled();
	});

	it("ignores a ping for a paused monitor", async () => {
		const { service, jobsRepository, checkService, scheduler } = setup({ monitor: makeMonitor({ isActive: false }) });

		await service.recordPing({ token: "t", action: "success" });

		expect(jobsRepository.rescheduleChecks).not.toHaveBeenCalled();
		expect(checkService.createChecks).not.toHaveBeenCalled();
		expect(jobsRepository.upsertEvaluate).not.toHaveBeenCalled();
		expect(scheduler.wake).not.toHaveBeenCalled();
	});

	it("pushes the deadline back during maintenance but records no check", async () => {
		const { service, jobsRepository, checkService, scheduler } = setup({ windows: [activeWindow()] });

		await service.recordPing({ token: "t", action: "success" });

		expect(jobsRepository.rescheduleChecks).toHaveBeenCalledWith(["mon-1"], expect.any(Number));
		expect(checkService.toCheck).not.toHaveBeenCalled();
		expect(checkService.createChecks).not.toHaveBeenCalled();
		expect(jobsRepository.upsertEvaluate).not.toHaveBeenCalled();
		expect(scheduler.wake).not.toHaveBeenCalled();
	});

	it("pushes the deadline back, stores an up check and queues it for evaluation", async () => {
		const { service, jobsRepository, checkService, scheduler } = setup();

		await service.recordPing({ token: "t", action: "success" });

		expect(jobsRepository.rescheduleChecks).toHaveBeenCalledWith(["mon-1"], expect.any(Number));
		expect(checkService.toCheck).toHaveBeenCalledWith(expect.objectContaining({ type: "heartbeat", responseTime: 0 }));
		expect(createdCheck(checkService)).toMatchObject({ status: true, statusCode: 200, message: "Ping received" });
		expect(jobsRepository.upsertEvaluate).toHaveBeenCalledWith("mon-1", [{ checkId: "chk-1", createdAt: expect.any(Number) }], expect.any(Number));
		expect(scheduler.wake).toHaveBeenCalledWith("evaluate");
	});

	it("records a reported failure as down", async () => {
		const { service, checkService } = setup();

		await service.recordPing({ token: "t", action: "fail" });

		expect(createdCheck(checkService)).toMatchObject({ status: false, statusCode: 500, message: "Reported failure" });
	});

	it("records a non-zero exit code as down with the code in the message", async () => {
		const { service, checkService } = setup();

		await service.recordPing({ token: "t", action: "fail", exitCode: 3 });

		expect(createdCheck(checkService)).toMatchObject({ status: false, statusCode: 500, message: "Exited with code 3" });
	});

	it("records exit code 0 as up", async () => {
		const { service, checkService } = setup();

		await service.recordPing({ token: "t", action: "success", exitCode: 0 });

		expect(createdCheck(checkService)).toMatchObject({ status: true, statusCode: 200, message: "Ping received" });
	});

	it("uses a client message, and falls back to the default for an empty one", async () => {
		const withMessage = setup();
		await withMessage.service.recordPing({ token: "t", action: "success", message: "backup ok" });
		expect(createdCheck(withMessage.checkService)).toMatchObject({ message: "backup ok" });

		const emptyMessage = setup();
		await emptyMessage.service.recordPing({ token: "t", action: "success", message: "" });
		expect(createdCheck(emptyMessage.checkService)).toMatchObject({ message: "Ping received" });
	});
});
