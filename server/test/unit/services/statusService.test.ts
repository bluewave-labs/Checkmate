import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { StatusService } from "../../../src/service/infrastructure/statusService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Monitor, MonitorStatusResponse, Check, HardwareStatusPayload } from "../../../src/types/index.ts";
import type { IMonitorsRepository, IMonitorStatsRepository, IChecksRepository } from "../../../src/repositories/index.ts";
import type { IBufferService } from "../../../src/service/infrastructure/bufferService.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createBuffer = (): jest.Mocked<Pick<IBufferService, "addToBuffer">> => ({
	addToBuffer: jest.fn(),
});

const createMonitorsRepo = () =>
	({
		findById: jest.fn(),
		updateById: jest.fn(),
	}) as unknown as jest.Mocked<IMonitorsRepository>;

const createMonitorStatsRepo = () =>
	({
		findByMonitorId: jest.fn(),
		create: jest.fn(),
		updateByMonitorId: jest.fn(),
	}) as unknown as jest.Mocked<IMonitorStatsRepository>;

const createChecksRepo = () => ({}) as unknown as jest.Mocked<IChecksRepository>;

const createService = (overrides?: {
	logger?: ReturnType<typeof createMockLogger>;
	buffer?: ReturnType<typeof createBuffer>;
	monitorsRepository?: ReturnType<typeof createMonitorsRepo>;
	monitorStatsRepository?: ReturnType<typeof createMonitorStatsRepo>;
	checksRepository?: ReturnType<typeof createChecksRepo>;
}) => {
	const logger = overrides?.logger ?? createMockLogger();
	const buffer = overrides?.buffer ?? createBuffer();
	const monitorsRepository = overrides?.monitorsRepository ?? createMonitorsRepo();
	const monitorStatsRepository = overrides?.monitorStatsRepository ?? createMonitorStatsRepo();
	const checksRepository = overrides?.checksRepository ?? createChecksRepo();

	const service = new StatusService(logger as any, buffer as any, monitorsRepository, monitorStatsRepository, checksRepository);
	return { service, logger, buffer, monitorsRepository, monitorStatsRepository, checksRepository };
};

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		userId: "user-1",
		teamId: "team-1",
		name: "Test Monitor",
		type: "http",
		url: "https://example.com",
		isActive: true,
		interval: 60000,
		status: "up",
		statusWindow: [],
		statusWindowSize: 5,
		statusWindowThreshold: 80,
		recentChecks: [],
		cpuAlertThreshold: 80,
		memoryAlertThreshold: 80,
		diskAlertThreshold: 80,
		tempAlertThreshold: 80,
		cpuAlertCounter: 5,
		memoryAlertCounter: 5,
		diskAlertCounter: 5,
		tempAlertCounter: 5,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Monitor;

const makeStatusResponse = (overrides?: Partial<MonitorStatusResponse>): MonitorStatusResponse =>
	({
		monitorId: "mon-1",
		teamId: "team-1",
		type: "http",
		status: true,
		code: 200,
		message: "OK",
		responseTime: 100,
		...overrides,
	}) as MonitorStatusResponse;

const makeCheck = (overrides?: Partial<Check>): Check =>
	({
		id: "check-1",
		metadata: { monitorId: "mon-1", teamId: "team-1" },
		status: true,
		responseTime: 100,
		statusCode: 200,
		message: "OK",
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Check;

const makeExistingStats = (overrides?: Record<string, unknown>) => ({
	id: "stats-1",
	monitorId: "mon-1",
	avgResponseTime: 100,
	maxResponseTime: 200,
	totalChecks: 10,
	totalUpChecks: 9,
	totalDownChecks: 1,
	uptimePercentage: 0.9,
	lastResponseTime: 90,
	lastCheckTimestamp: 1000,
	timeOfLastFailure: 500,
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-01-01T00:00:00Z",
	...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("StatusService", () => {
	describe("serviceName", () => {
		it("returns StatusService", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("StatusService");
		});
	});

	// ── updateRunningStats ───────────────────────────────────────────────────

	describe("updateRunningStats", () => {
		// The service now delegates the entire running-stats computation to the repository's
		// atomic `updateByMonitorId`, so the service-level tests only verify forwarding and error
		// handling. The math (running average, uptimePercentage, timeOfLastFailure state machine)
		// is a repository-level concern and is exercised by the repository tests.

		it("forwards a successful check to updateByMonitorId", async () => {
			const { service, monitorStatsRepository } = createService();
			(monitorStatsRepository.updateByMonitorId as jest.Mock).mockResolvedValue({});

			const result = await service.updateRunningStats(makeMonitor(), makeStatusResponse({ responseTime: 50 }));

			expect(result).toBe(true);
			expect(monitorStatsRepository.updateByMonitorId).toHaveBeenCalledWith(
				"mon-1",
				expect.objectContaining({
					status: true,
					responseTime: 50,
					now: expect.any(Number),
				})
			);
		});

		it("forwards a failed check to updateByMonitorId", async () => {
			const { service, monitorStatsRepository } = createService();
			(monitorStatsRepository.updateByMonitorId as jest.Mock).mockResolvedValue({});

			const result = await service.updateRunningStats(makeMonitor(), makeStatusResponse({ status: false, responseTime: 100 }));

			expect(result).toBe(true);
			expect(monitorStatsRepository.updateByMonitorId).toHaveBeenCalledWith("mon-1", expect.objectContaining({ status: false, responseTime: 100 }));
		});

		it("passes 0 when responseTime is undefined", async () => {
			const { service, monitorStatsRepository } = createService();
			(monitorStatsRepository.updateByMonitorId as jest.Mock).mockResolvedValue({});

			await service.updateRunningStats(makeMonitor(), makeStatusResponse({ responseTime: undefined }));

			expect(monitorStatsRepository.updateByMonitorId).toHaveBeenCalledWith("mon-1", expect.objectContaining({ responseTime: 0 }));
		});

		it("forwards responseTime of 0 as 0 (falsy but defined)", async () => {
			const { service, monitorStatsRepository } = createService();
			(monitorStatsRepository.updateByMonitorId as jest.Mock).mockResolvedValue({});

			await service.updateRunningStats(makeMonitor(), makeStatusResponse({ responseTime: 0 }));

			expect(monitorStatsRepository.updateByMonitorId).toHaveBeenCalledWith("mon-1", expect.objectContaining({ responseTime: 0 }));
		});

		it("coerces a non-true status to false (e.g. undefined)", async () => {
			const { service, monitorStatsRepository } = createService();
			(monitorStatsRepository.updateByMonitorId as jest.Mock).mockResolvedValue({});

			await service.updateRunningStats(makeMonitor(), makeStatusResponse({ status: undefined as unknown as boolean }));

			expect(monitorStatsRepository.updateByMonitorId).toHaveBeenCalledWith("mon-1", expect.objectContaining({ status: false }));
		});

		it("returns false and logs error when updateByMonitorId throws", async () => {
			const { service, logger, monitorStatsRepository } = createService();
			(monitorStatsRepository.updateByMonitorId as jest.Mock).mockRejectedValue(new Error("db write failed"));

			const result = await service.updateRunningStats(makeMonitor(), makeStatusResponse());

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					service: "StatusService",
					method: "updateRunningStats",
					message: "db write failed",
				})
			);
		});

		it("logs error with 'Unknown error' for non-Error exceptions", async () => {
			const { service, logger, monitorStatsRepository } = createService();
			(monitorStatsRepository.updateByMonitorId as jest.Mock).mockRejectedValue("string error");

			const result = await service.updateRunningStats(makeMonitor(), makeStatusResponse());

			expect(result).toBe(false);
			expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── updateMonitorStatus ──────────────────────────────────────────────────

	describe("updateMonitorStatus", () => {
		it("returns early with no status change when statusWindow is not full", async () => {
			const monitor = makeMonitor({ statusWindow: [], statusWindowSize: 5, status: "up" });
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			const result = await service.updateMonitorStatus(makeStatusResponse({ status: true }), makeCheck());

			expect(result.statusChanged).toBe(false);
			expect(result.prevStatus).toBe("up");
		});

		it("pushes to statusWindow and trims to statusWindowSize", async () => {
			const monitor = makeMonitor({ statusWindow: [true, true, true, true, true], statusWindowSize: 5 });
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			await service.updateMonitorStatus(makeStatusResponse({ status: false }), makeCheck());

			// Window should have shifted: [true, true, true, true, false]
			expect(monitor.statusWindow).toHaveLength(5);
			expect(monitor.statusWindow[4]).toBe(false);
		});

		it("pushes check snapshot to recentChecks and trims to 25", async () => {
			const existingChecks = Array.from({ length: 25 }, (_, i) => ({ id: `old-${i}` }));
			const monitor = makeMonitor({ recentChecks: existingChecks as any, statusWindow: [], statusWindowSize: 5 });
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			await service.updateMonitorStatus(makeStatusResponse(), makeCheck({ id: "new-check" }));

			expect(monitor.recentChecks).toHaveLength(25);
			expect(monitor.recentChecks[24]).toEqual(expect.objectContaining({ id: "new-check" }));
		});

		it("marks status as down when failure threshold is met", async () => {
			// 5/5 failures = 100% >= 80% threshold
			const monitor = makeMonitor({
				statusWindow: [false, false, false, false],
				statusWindowSize: 5,
				statusWindowThreshold: 80,
				status: "up",
			});
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			const result = await service.updateMonitorStatus(makeStatusResponse({ status: false }), makeCheck({ status: false }));

			expect(result.statusChanged).toBe(true);
			expect(result.monitor.status).toBe("down");
		});

		it("recovers to up when failure rate drops below threshold", async () => {
			// 1/5 failures = 20% < 80% threshold, and monitor was down
			const monitor = makeMonitor({
				statusWindow: [true, true, true, false],
				statusWindowSize: 5,
				statusWindowThreshold: 80,
				status: "down",
			});
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			const result = await service.updateMonitorStatus(makeStatusResponse({ status: true }), makeCheck({ status: true }));

			expect(result.statusChanged).toBe(true);
			expect(result.monitor.status).toBe("up");
		});

		it("does not change status when already up and below threshold", async () => {
			const monitor = makeMonitor({
				statusWindow: [true, true, true, true],
				statusWindowSize: 5,
				statusWindowThreshold: 80,
				status: "up",
			});
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			const result = await service.updateMonitorStatus(makeStatusResponse({ status: true }), makeCheck());

			expect(result.statusChanged).toBe(false);
			expect(result.monitor.status).toBe("up");
		});

		it("keeps status 'up' on a sub-threshold failed check (regression: #3438)", async () => {
			// Monitor is up, window has one failure already, incoming check fails.
			// 2/5 = 40% < 80% threshold — must NOT silently write status='down',
			// otherwise the next successful check fires a spurious 'Recovered' notification.
			const monitor = makeMonitor({
				statusWindow: [true, true, true, false],
				statusWindowSize: 5,
				statusWindowThreshold: 80,
				status: "up",
			});
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			const result = await service.updateMonitorStatus(makeStatusResponse({ status: false }), makeCheck({ status: false }));

			expect(result.statusChanged).toBe(false);
			expect(result.monitor.status).toBe("up");
		});

		it("does not change status when already down and still above threshold", async () => {
			const monitor = makeMonitor({
				statusWindow: [false, false, false, false],
				statusWindowSize: 5,
				statusWindowThreshold: 80,
				status: "down",
			});
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			const result = await service.updateMonitorStatus(makeStatusResponse({ status: false }), makeCheck({ status: false }));

			expect(result.statusChanged).toBe(false);
			expect(result.monitor.status).toBe("down");
		});

		it("initializes statusWindow when undefined", async () => {
			const monitor = makeMonitor({ statusWindow: undefined as any, statusWindowSize: 5 });
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			await service.updateMonitorStatus(makeStatusResponse(), makeCheck());

			expect(monitor.statusWindow).toEqual([true]);
		});

		it("initializes recentChecks when undefined", async () => {
			const monitor = makeMonitor({ recentChecks: undefined as any, statusWindowSize: 5 });
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			await service.updateMonitorStatus(makeStatusResponse(), makeCheck());

			expect(monitor.recentChecks).toHaveLength(1);
		});

		it("throws AppError when repository throws", async () => {
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockRejectedValue(new Error("db error"));

			await expect(service.updateMonitorStatus(makeStatusResponse(), makeCheck())).rejects.toThrow("Failed to update monitor");
		});

		it("throws AppError with 'Unknown error' for non-Error exceptions", async () => {
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockRejectedValue("string error");

			await expect(service.updateMonitorStatus(makeStatusResponse(), makeCheck())).rejects.toThrow("Unknown error");
		});

		it("returns code and timestamp in result", async () => {
			const monitor = makeMonitor({ statusWindow: [true, true, true, true], statusWindowSize: 5 });
			const { service, monitorsRepository } = createService();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

			const result = await service.updateMonitorStatus(makeStatusResponse({ code: 201 }), makeCheck());

			expect(result.code).toBe(201);
			expect(result.timestamp).toBeGreaterThan(0);
		});

		// ── Hardware threshold breach tests ──────────────────────────────────

		describe("hardware threshold breaches", () => {
			const makeHardwareMonitor = (overrides?: Partial<Monitor>) =>
				makeMonitor({
					type: "hardware",
					statusWindow: [true, true, true, true],
					statusWindowSize: 5,
					status: "up",
					cpuAlertThreshold: 80,
					memoryAlertThreshold: 80,
					diskAlertThreshold: 80,
					tempAlertThreshold: 80,
					cpuAlertCounter: 5,
					memoryAlertCounter: 5,
					diskAlertCounter: 5,
					tempAlertCounter: 5,
					...overrides,
				});

			const makeHardwareResponse = (payload: HardwareStatusPayload, overrides?: Partial<MonitorStatusResponse<HardwareStatusPayload>>) =>
				makeStatusResponse({
					type: "hardware",
					status: true,
					payload,
					...overrides,
				} as any) as MonitorStatusResponse<HardwareStatusPayload>;

			it("detects CPU threshold breach and decrements counter", async () => {
				const monitor = makeHardwareMonitor({ cpuAlertCounter: 1 });
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({ data: { cpu: { usage_percent: 0.9 }, memory: { usage_percent: 0.5 }, disk: [], host: {} } } as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.cpu).toBe(true);
				expect(result.thresholdBreaches?.memory).toBe(false);
				expect(monitor.cpuAlertCounter).toBe(0);
				expect(result.statusChanged).toBe(true);
				expect(result.monitor.status).toBe("breached");
			});

			it("detects memory threshold breach", async () => {
				const monitor = makeHardwareMonitor({ memoryAlertCounter: 1 });
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({ data: { cpu: { usage_percent: 0.5 }, memory: { usage_percent: 0.9 }, disk: [], host: {} } } as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.memory).toBe(true);
				expect(monitor.memoryAlertCounter).toBe(0);
				expect(result.monitor.status).toBe("breached");
			});

			it("detects disk threshold breach", async () => {
				const monitor = makeHardwareMonitor({ diskAlertCounter: 1 });
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1 }, memory: { usage_percent: 0.1 }, disk: [{ usage_percent: 0.95 }], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.disk).toBe(true);
				expect(monitor.diskAlertCounter).toBe(0);
				expect(result.monitor.status).toBe("breached");
			});

			it("detects temperature threshold breach", async () => {
				const monitor = makeHardwareMonitor({ tempAlertCounter: 1 });
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1, temperature: [90] }, memory: { usage_percent: 0.1 }, disk: [], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.temp).toBe(true);
				expect(monitor.tempAlertCounter).toBe(0);
				expect(result.monitor.status).toBe("breached");
			});

			it("resets counters to 5 when thresholds are not breached", async () => {
				const monitor = makeHardwareMonitor({
					cpuAlertCounter: 2,
					memoryAlertCounter: 2,
					diskAlertCounter: 2,
					tempAlertCounter: 2,
				});
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1, temperature: [30] }, memory: { usage_percent: 0.1 }, disk: [{ usage_percent: 0.1 }], host: {} },
				} as any);
				await service.updateMonitorStatus(response, makeCheck());

				expect(monitor.cpuAlertCounter).toBe(5);
				expect(monitor.memoryAlertCounter).toBe(5);
				expect(monitor.diskAlertCounter).toBe(5);
				expect(monitor.tempAlertCounter).toBe(5);
			});

			it("stays breached without statusChanged when already breached and counter still at 0", async () => {
				const monitor = makeHardwareMonitor({
					status: "breached",
					cpuAlertCounter: 1,
				});
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({ data: { cpu: { usage_percent: 0.9 }, memory: { usage_percent: 0.1 }, disk: [], host: {} } } as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.monitor.status).toBe("breached");
				expect(result.statusChanged).toBe(false);
			});

			it("recovers from breached to up when all thresholds return to normal", async () => {
				const monitor = makeHardwareMonitor({ status: "breached" });
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1, temperature: [30] }, memory: { usage_percent: 0.1 }, disk: [{ usage_percent: 0.1 }], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.statusChanged).toBe(true);
				expect(result.monitor.status).toBe("up");
			});

			it("does not override down status with breached", async () => {
				// Monitor is down due to failure threshold, hardware breaches should not override
				const monitor = makeHardwareMonitor({
					statusWindow: [false, false, false, false],
					statusWindowSize: 5,
					statusWindowThreshold: 80,
					status: "up",
					cpuAlertCounter: 1,
				});
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					status: false,
					data: { cpu: { usage_percent: 0.9 }, memory: { usage_percent: 0.1 }, disk: [], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck({ status: false }));

				expect(result.monitor.status).toBe("down");
			});

			it("handles missing cpu usage_percent (returns -1)", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({ data: { cpu: {}, memory: { usage_percent: 0.1 }, disk: [], host: {} } } as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.cpu).toBe(false);
			});

			it("handles missing memory usage_percent", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({ data: { cpu: { usage_percent: 0.1 }, memory: {}, disk: [], host: {} } } as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.memory).toBe(false);
			});

			it("handles empty temperature array", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1, temperature: [] }, memory: { usage_percent: 0.1 }, disk: [], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.temp).toBe(false);
			});

			it("handles undefined temperature", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1 }, memory: { usage_percent: 0.1 }, disk: [], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.temp).toBe(false);
			});

			it("skips threshold evaluation when payload is undefined", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse(undefined as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches).toBeUndefined();
			});

			it("skips threshold evaluation when payload.data is undefined", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches).toBeUndefined();
			});

			it("does not set thresholdBreaches for non-hardware monitors", async () => {
				const monitor = makeMonitor({
					type: "http",
					statusWindow: [true, true, true, true],
					statusWindowSize: 5,
				});
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const result = await service.updateMonitorStatus(makeStatusResponse(), makeCheck());

				expect(result.thresholdBreaches).toBeUndefined();
			});

			it("handles null entry in disk array", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1 }, memory: { usage_percent: 0.1 }, disk: [null as any], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.disk).toBe(false);
			});

			it("handles disk with undefined usage_percent entries", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1 }, memory: { usage_percent: 0.1 }, disk: [{ device: "/dev/sda" }], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.disk).toBe(false);
			});

			it("handles nullish cpu in metrics", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: undefined, memory: { usage_percent: 0.1 }, disk: [], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.cpu).toBe(false);
				expect(result.thresholdBreaches?.temp).toBe(false);
			});

			it("handles nullish memory in metrics", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1 }, memory: undefined, disk: [], host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.memory).toBe(false);
			});

			it("handles nullish disk in metrics", async () => {
				const monitor = makeHardwareMonitor();
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.1 }, memory: { usage_percent: 0.1 }, disk: undefined, host: {} },
				} as any);
				const result = await service.updateMonitorStatus(response, makeCheck());

				expect(result.thresholdBreaches?.disk).toBe(false);
			});

			it("counters do not go below 0", async () => {
				const monitor = makeHardwareMonitor({
					cpuAlertCounter: 0,
					memoryAlertCounter: 0,
					diskAlertCounter: 0,
					tempAlertCounter: 0,
				});
				const { service, monitorsRepository } = createService();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(monitorsRepository.updateById as jest.Mock).mockImplementation((_id: unknown, _tid: unknown, m: unknown) => Promise.resolve(m));

				const response = makeHardwareResponse({
					data: { cpu: { usage_percent: 0.9, temperature: [90] }, memory: { usage_percent: 0.9 }, disk: [{ usage_percent: 0.95 }], host: {} },
				} as any);
				await service.updateMonitorStatus(response, makeCheck());

				expect(monitor.cpuAlertCounter).toBe(0);
				expect(monitor.memoryAlertCounter).toBe(0);
				expect(monitor.diskAlertCounter).toBe(0);
				expect(monitor.tempAlertCounter).toBe(0);
			});
		});
	});
});
