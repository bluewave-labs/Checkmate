import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { MonitorService } from "../../../src/service/business/monitorService.ts";
import type {
	IChecksRepository,
	IGeoChecksRepository,
	IIncidentsRepository,
	IMonitorStatsRepository,
	IMonitorsRepository,
	IStatusPagesRepository,
} from "../../../src/repositories/index.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const createMonitorsRepositoryMock = () =>
	({
		create: jest.fn(),
		createMonitors: jest.fn(),
		findById: jest.fn(),
		findByTeamId: jest.fn(),
		findByIds: jest.fn(),
		findMonitorCountByTeamIdAndType: jest.fn(),
		findMonitorsSummaryByTeamId: jest.fn(),
		findGroupsByTeamId: jest.fn(),
		updateById: jest.fn(),
		updateNotifications: jest.fn(),
		togglePauseById: jest.fn(),
		deleteById: jest.fn(),
		deleteByTeamId: jest.fn(),
	}) as unknown as IMonitorsRepository;

const createChecksRepositoryMock = () =>
	({
		findByDateRangeAndMonitorId: jest.fn(),
		deleteByMonitorId: jest.fn(),
	}) as unknown as IChecksRepository;

const createMonitorStatsRepositoryMock = () =>
	({
		findByMonitorId: jest.fn(),
		deleteByMonitorId: jest.fn(),
	}) as unknown as IMonitorStatsRepository;

const createStatusPagesRepositoryMock = () =>
	({
		removeMonitorFromStatusPages: jest.fn(),
	}) as unknown as IStatusPagesRepository;

const createGeoChecksRepositoryMock = () =>
	({
		findGroupedByMonitorIdAndDateRange: jest.fn(),
		deleteByMonitorId: jest.fn(),
	}) as unknown as IGeoChecksRepository;

const createIncidentsRepositoryMock = () =>
	({
		deleteByMonitorId: jest.fn(),
	}) as unknown as IIncidentsRepository;

const createJobQueueMock = () => ({
	addJob: jest.fn(),
	updateJob: jest.fn(),
	resumeJob: jest.fn(),
	pauseJob: jest.fn(),
	deleteJob: jest.fn(),
});

const TEAM_ID = "team-1";
const MONITOR_ID = "monitor-1";
const USER_ID = "user-1";

const makeMonitor = (overrides: Record<string, unknown> = {}) => ({
	id: MONITOR_ID,
	teamId: TEAM_ID,
	userId: USER_ID,
	name: "Test Monitor",
	type: "http" as const,
	url: "https://example.com",
	isActive: true,
	interval: 60000,
	recentChecks: [],
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	...overrides,
});

const createService = (
	overrides: {
		monitorsRepository?: IMonitorsRepository;
		checksRepository?: IChecksRepository;
		monitorStatsRepository?: IMonitorStatsRepository;
		statusPagesRepository?: IStatusPagesRepository;
		geoChecksRepository?: IGeoChecksRepository;
		incidentsRepository?: IIncidentsRepository;
		jobQueue?: ReturnType<typeof createJobQueueMock>;
		logger?: ReturnType<typeof createMockLogger>;
		games?: Record<string, unknown>;
	} = {}
) => {
	const jobQueue = overrides.jobQueue ?? createJobQueueMock();
	const logger = overrides.logger ?? createMockLogger();
	const service = new MonitorService({
		jobQueue: jobQueue as any,
		logger: logger as any,
		games: (overrides.games ?? { cs2: { name: "Counter-Strike 2" } }) as any,
		monitorsRepository: overrides.monitorsRepository ?? createMonitorsRepositoryMock(),
		checksRepository: overrides.checksRepository ?? createChecksRepositoryMock(),
		geoChecksRepository: overrides.geoChecksRepository ?? createGeoChecksRepositoryMock(),
		monitorStatsRepository: overrides.monitorStatsRepository ?? createMonitorStatsRepositoryMock(),
		statusPagesRepository: overrides.statusPagesRepository ?? createStatusPagesRepositoryMock(),
		incidentsRepository: overrides.incidentsRepository ?? createIncidentsRepositoryMock(),
	});
	return { service, jobQueue, logger };
};

describe("MonitorService", () => {
	describe("serviceName", () => {
		it("returns 'MonitorService'", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("MonitorService");
		});
	});

	describe("createMonitor", () => {
		it("creates a monitor and adds a job", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor();
			(monitorsRepository.create as jest.Mock).mockResolvedValue(monitor);
			const { service, jobQueue } = createService({ monitorsRepository });

			await service.createMonitor(TEAM_ID, USER_ID, monitor as any);

			expect(monitorsRepository.create).toHaveBeenCalledWith(monitor, TEAM_ID, USER_ID);
			expect(jobQueue.addJob).toHaveBeenCalledWith(MONITOR_ID, monitor);
		});

		it("throws when repository returns null", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.create as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository });

			await expect(service.createMonitor(TEAM_ID, USER_ID, {} as any)).rejects.toThrow("Failed to create monitor");
		});
	});

	describe("createMonitors", () => {
		it("creates multiple monitors and adds jobs for each", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitors = [makeMonitor({ id: "m1" }), makeMonitor({ id: "m2" })];
			(monitorsRepository.createMonitors as jest.Mock).mockResolvedValue(monitors);
			const { service, jobQueue } = createService({ monitorsRepository });

			const result = await service.createMonitors(monitors as any);

			expect(result).toHaveLength(2);
			expect(jobQueue.addJob).toHaveBeenCalledTimes(2);
		});

		it("throws when repository returns empty array", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.createMonitors as jest.Mock).mockResolvedValue([]);
			const { service } = createService({ monitorsRepository });

			await expect(service.createMonitors([makeMonitor()] as any)).rejects.toThrow("Failed to create monitors");
		});

		it("throws when repository returns null", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.createMonitors as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository });

			await expect(service.createMonitors([makeMonitor()] as any)).rejects.toThrow("Failed to create monitors");
		});
	});

	describe("addDemoMonitors", () => {
		it("creates demo monitors from JSON data and adds jobs", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const demoMonitors = [makeMonitor({ id: "d1", name: "Google" }), makeMonitor({ id: "d2", name: "Facebook" })];
			(monitorsRepository.createMonitors as jest.Mock).mockResolvedValue(demoMonitors);
			const { service, jobQueue } = createService({ monitorsRepository });

			const result = await service.addDemoMonitors({ userId: USER_ID, teamId: TEAM_ID });

			expect(result).toHaveLength(2);
			expect(monitorsRepository.createMonitors).toHaveBeenCalledTimes(1);
			const callArg = (monitorsRepository.createMonitors as jest.Mock).mock.calls[0]![0] as any[];
			expect(callArg[0]).toMatchObject({ userId: USER_ID, teamId: TEAM_ID, type: "http", interval: 60000 });
			expect(jobQueue.addJob).toHaveBeenCalledTimes(2);
		});
	});

	describe("getUptimeDetailsById", () => {
		it("returns monitorData and monitorStats for an http monitor", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const monitor = makeMonitor();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
				monitorType: "http",
				groupedChecks: [{ _id: "2024-01-01", avgResponseTime: 100, totalChecks: 2 }],
				groupedUpChecks: [{ _id: "2024-01-01", totalChecks: 2, avgResponseTime: 90 }],
				groupedDownChecks: [{ _id: "2024-01-01", totalChecks: 0, avgResponseTime: 0 }],
				uptimePercentage: 0.99,
				avgResponseTime: 95,
			});
			(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue({ monitorId: MONITOR_ID });

			const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });
			const result = await service.getUptimeDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" });

			expect(result).toHaveProperty("monitorData");
			expect(result).toHaveProperty("monitorStats");
			expect(result.monitorData.monitor).toMatchObject({ id: MONITOR_ID });
		});

		it("supports all uptime monitor types: ping, docker, port, game, grpc, websocket", async () => {
			for (const monitorType of ["ping", "docker", "port", "game", "grpc", "websocket"] as const) {
				const monitorsRepository = createMonitorsRepositoryMock();
				const checksRepository = createChecksRepositoryMock();
				const monitorStatsRepository = createMonitorStatsRepositoryMock();
				const monitor = makeMonitor({ type: monitorType });
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
					monitorType,
					groupedChecks: [],
					groupedUpChecks: [],
					groupedDownChecks: [],
					uptimePercentage: 1,
					avgResponseTime: 50,
				});
				(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue(null);

				const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });
				const result = await service.getUptimeDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "day" });
				expect(result.monitorData.monitor.type).toBe(monitorType);
			}
		});

		it("throws 404 when monitor not found", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository });

			await expect(service.getUptimeDetailsById({ teamId: TEAM_ID, monitorId: "missing", dateRange: "recent" })).rejects.toThrow(
				"Monitor with ID missing not found."
			);
		});

		it("throws 400 for unsupported monitor type (hardware)", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const monitor = makeMonitor({ type: "hardware" });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
				monitorType: "hardware",
				groupedChecks: [],
				groupedUpChecks: [],
				groupedDownChecks: [],
				uptimePercentage: 0,
				avgResponseTime: 0,
			});
			(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue(null);

			const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });
			await expect(service.getUptimeDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" })).rejects.toThrow(
				"monitors are not supported for uptime details"
			);
		});

		it("throws 400 for unsupported monitor type (pagespeed)", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const monitor = makeMonitor({ type: "pagespeed" });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
				monitorType: "pagespeed",
				groupedChecks: [],
				groupedUpChecks: [],
				groupedDownChecks: [],
				uptimePercentage: 0,
				avgResponseTime: 0,
			});
			(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue(null);

			const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });
			await expect(service.getUptimeDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "week" })).rejects.toThrow(
				"monitors are not supported for uptime details"
			);
		});

		it("uses different date ranges correctly", async () => {
			for (const dateRange of ["recent", "day", "week", "month", "all"] as const) {
				const monitorsRepository = createMonitorsRepositoryMock();
				const checksRepository = createChecksRepositoryMock();
				const monitorStatsRepository = createMonitorStatsRepositoryMock();
				const monitor = makeMonitor();
				(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
				(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
					monitorType: "http",
					groupedChecks: [],
					groupedUpChecks: [],
					groupedDownChecks: [],
					uptimePercentage: 1,
					avgResponseTime: 50,
				});
				(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue(null);

				const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });
				await service.getUptimeDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange });
				expect(checksRepository.findByDateRangeAndMonitorId).toHaveBeenCalled();
			}
		});
	});

	describe("getHardwareDetailsById", () => {
		it("returns hardware details for a hardware monitor", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const monitor = makeMonitor({ type: "hardware" });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
				monitorType: "hardware",
				aggregateData: { totalChecks: 10 },
				upChecks: { totalChecks: 9 },
				checks: [],
			});
			(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue({ monitorId: MONITOR_ID });

			const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });
			const result = await service.getHardwareDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" });

			expect(result.monitor).toMatchObject({ id: MONITOR_ID });
			expect(result.stats).toHaveProperty("aggregateData");
			expect(result.stats).toHaveProperty("upChecks");
			expect(result.stats).toHaveProperty("checks");
			expect(result.monitorStats).toMatchObject({ monitorId: MONITOR_ID });
		});

		it("throws 404 when monitor not found", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository });

			await expect(service.getHardwareDetailsById({ teamId: TEAM_ID, monitorId: "missing", dateRange: "recent" })).rejects.toThrow(
				"Monitor with ID missing not found."
			);
		});

		it("throws 400 when monitor type is not hardware", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor({ type: "http" });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const { service } = createService({ monitorsRepository });

			await expect(service.getHardwareDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" })).rejects.toThrow(
				"monitors are not supported for hardware details"
			);
		});
	});

	describe("getPageSpeedDetailsById", () => {
		it("returns pagespeed details for a pagespeed monitor", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const monitor = makeMonitor({ type: "pagespeed" });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
				monitorType: "pagespeed",
				groupedChecks: [{ _id: "2024-01-01", performance: 95 }],
			});
			(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue({ monitorId: MONITOR_ID });

			const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });
			const result = await service.getPageSpeedDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" });

			expect(result.monitorData.monitor).toMatchObject({ id: MONITOR_ID });
			expect(result.monitorData.groupedChecks).toHaveLength(1);
			expect(result.monitorStats).toMatchObject({ monitorId: MONITOR_ID });
		});

		it("throws 404 when monitor not found", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository });

			await expect(service.getPageSpeedDetailsById({ teamId: TEAM_ID, monitorId: "missing", dateRange: "recent" })).rejects.toThrow(
				"Monitor with ID missing not found."
			);
		});

		it("throws 400 when monitor type is not pagespeed", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor({ type: "http" });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const { service } = createService({ monitorsRepository });

			await expect(service.getPageSpeedDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" })).rejects.toThrow(
				"monitors are not supported for pagespeed details"
			);
		});

		it("handles pagespeed with different date range", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const monitor = makeMonitor({ type: "pagespeed" });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(checksRepository.findByDateRangeAndMonitorId as jest.Mock).mockResolvedValue({
				monitorType: "pagespeed",
				groupedChecks: [],
			});
			(monitorStatsRepository.findByMonitorId as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository, checksRepository, monitorStatsRepository });

			await service.getPageSpeedDetailsById({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "week" });
			expect(checksRepository.findByDateRangeAndMonitorId).toHaveBeenCalled();
		});
	});

	describe("getGeoChecksByMonitorId", () => {
		it("throws 404 when monitor not found", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository });

			await expect(service.getGeoChecksByMonitorId({ teamId: TEAM_ID, monitorId: "missing", dateRange: "recent" })).rejects.toThrow(
				"Monitor with ID missing not found."
			);
		});

		it("returns empty when monitor type does not support geo checks", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor({ type: "hardware", geoCheckEnabled: true });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const { service } = createService({ monitorsRepository });

			const result = await service.getGeoChecksByMonitorId({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" });
			expect(result).toEqual({ groupedGeoChecks: [] });
		});

		it("returns empty when geoCheckEnabled is false", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor({ type: "http", geoCheckEnabled: false });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const { service } = createService({ monitorsRepository });

			const result = await service.getGeoChecksByMonitorId({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" });
			expect(result).toEqual({ groupedGeoChecks: [] });
		});

		it("returns empty when geoCheckEnabled is undefined", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor({ type: "http", geoCheckEnabled: undefined });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const { service } = createService({ monitorsRepository });

			const result = await service.getGeoChecksByMonitorId({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "recent" });
			expect(result).toEqual({ groupedGeoChecks: [] });
		});

		it("returns grouped geo checks when supported and enabled", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();
			const monitor = makeMonitor({ type: "http", geoCheckEnabled: true });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const geoData = [{ continent: "NA", avgResponseTime: 50, totalChecks: 5 }];
			(geoChecksRepository.findGroupedByMonitorIdAndDateRange as jest.Mock).mockResolvedValue(geoData);

			const { service } = createService({ monitorsRepository, geoChecksRepository });
			const result = await service.getGeoChecksByMonitorId({
				teamId: TEAM_ID,
				monitorId: MONITOR_ID,
				dateRange: "recent",
				continents: ["NA"] as any,
			});

			expect(result.groupedGeoChecks).toEqual(geoData);
			expect(geoChecksRepository.findGroupedByMonitorIdAndDateRange).toHaveBeenCalled();
		});

		it("works with ping monitor type", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();
			const monitor = makeMonitor({ type: "ping", geoCheckEnabled: true });
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			(geoChecksRepository.findGroupedByMonitorIdAndDateRange as jest.Mock).mockResolvedValue([]);

			const { service } = createService({ monitorsRepository, geoChecksRepository });
			const result = await service.getGeoChecksByMonitorId({ teamId: TEAM_ID, monitorId: MONITOR_ID, dateRange: "day" });

			expect(result.groupedGeoChecks).toEqual([]);
		});
	});

	describe("getMonitorById", () => {
		it("delegates to repository findById", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const { service } = createService({ monitorsRepository });

			const result = await service.getMonitorById({ teamId: TEAM_ID, monitorId: MONITOR_ID });
			expect(result).toEqual(monitor);
			expect(monitorsRepository.findById).toHaveBeenCalledWith(MONITOR_ID, TEAM_ID);
		});
	});

	describe("getMonitorsByTeamId", () => {
		it("returns monitors from repository", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitors = [makeMonitor({ id: "m1" }), makeMonitor({ id: "m2" })];
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue(monitors);
			const { service } = createService({ monitorsRepository });

			const result = await service.getMonitorsByTeamId({ teamId: TEAM_ID });
			expect(result).toHaveLength(2);
		});

		it("passes type and filter to repository", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([]);
			const { service } = createService({ monitorsRepository });

			await service.getMonitorsByTeamId({ teamId: TEAM_ID, type: "http", filter: "test" });
			expect(monitorsRepository.findByTeamId).toHaveBeenCalledWith(TEAM_ID, { type: "http", filter: "test" });
		});
	});

	describe("getMonitorsWithChecksByTeamId", () => {
		it("returns summary, count, and monitors with normalized checks", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 1, upMonitors: 1 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(1);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([
				makeMonitor({
					recentChecks: [
						{ responseTime: 10, status: true, message: "OK" },
						{ responseTime: 20, status: true, message: "OK" },
					],
				}),
			]);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID });

			expect(result.summary).toMatchObject({ totalMonitors: 1 });
			expect(result.count).toBe(1);
			expect(result.monitors).toHaveLength(1);
		});

		it("returns null summary when repository returns null", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue(null);
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(0);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue(null);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID });

			expect(result.summary).toBeNull();
			expect(result.monitors).toEqual([]);
		});

		it("uses snapshot (first check only) for hardware type monitors", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 1 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(1);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([
				makeMonitor({
					type: "hardware",
					recentChecks: [
						{ responseTime: 10, status: true, message: "OK" },
						{ responseTime: 20, status: true, message: "OK" },
						{ responseTime: 30, status: true, message: "OK" },
					],
				}),
			]);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID, type: "hardware" });

			expect(result.monitors[0].recentChecks).toHaveLength(1);
		});

		it("uses snapshot for hardware type when type is array with hardware", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 1 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(1);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([
				makeMonitor({
					type: "hardware",
					recentChecks: [
						{ responseTime: 10, status: true, message: "OK" },
						{ responseTime: 20, status: true, message: "OK" },
					],
				}),
			]);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID, type: ["hardware"] });

			expect(result.monitors[0].recentChecks).toHaveLength(1);
		});

		it("normalizes checks for non-snapshot types when type is an array", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 1 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(1);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([
				makeMonitor({
					type: "http",
					recentChecks: [
						{ responseTime: 10, status: true, message: "OK" },
						{ responseTime: 20, status: true, message: "OK" },
					],
				}),
			]);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID, type: ["http", "ping"] });

			expect(result.monitors[0].recentChecks.length).toBeGreaterThan(0);
		});

		it("normalizes checks when type is undefined (mixed types)", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 2 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(2);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([
				makeMonitor({
					id: "m1",
					type: "http",
					recentChecks: [
						{ responseTime: 10, status: true, message: "OK" },
						{ responseTime: 20, status: true, message: "OK" },
					],
				}),
				makeMonitor({
					id: "m2",
					type: "hardware",
					recentChecks: [
						{ responseTime: 10, status: true, message: "OK" },
						{ responseTime: 20, status: true, message: "OK" },
						{ responseTime: 30, status: true, message: "OK" },
					],
				}),
			]);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID });

			// http monitor gets normalized, hardware gets snapshot (1 check)
			expect(result.monitors[1].recentChecks).toHaveLength(1);
			expect(result.monitors[0].recentChecks.length).toBeGreaterThan(0);
		});

		it("handles monitors with empty recentChecks", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 1 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(1);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([makeMonitor({ recentChecks: [] })]);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID });

			expect(result.monitors[0].recentChecks).toEqual([]);
		});

		it("handles monitors with undefined recentChecks", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 1 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(1);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([makeMonitor({ recentChecks: undefined })]);

			const { service } = createService({ monitorsRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: TEAM_ID });

			expect(result.monitors[0].recentChecks).toEqual([]);
		});

		it("passes all query params to repository", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorsSummaryByTeamId as jest.Mock).mockResolvedValue({ totalMonitors: 0 });
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(0);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([]);

			const { service } = createService({ monitorsRepository });
			await service.getMonitorsWithChecksByTeamId({
				teamId: TEAM_ID,
				limit: 10,
				type: "http",
				page: 1,
				rowsPerPage: 25,
				filter: "test",
				field: "name",
				order: "asc",
			});

			expect(monitorsRepository.findByTeamId).toHaveBeenCalledWith(TEAM_ID, {
				limit: 10,
				type: "http",
				page: 1,
				rowsPerPage: 25,
				filter: "test",
				field: "name",
				order: "asc",
			});
		});
	});

	describe("getAllGames", () => {
		it("returns the games map", () => {
			const games = { cs2: { name: "Counter-Strike 2" } };
			const { service } = createService({ games });
			expect(service.getAllGames()).toEqual(games);
		});
	});

	describe("getGroupsByTeamId", () => {
		it("delegates to repository", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findGroupsByTeamId as jest.Mock).mockResolvedValue(["group1", "group2"]);
			const { service } = createService({ monitorsRepository });

			const result = await service.getGroupsByTeamId({ teamId: TEAM_ID });
			expect(result).toEqual(["group1", "group2"]);
			expect(monitorsRepository.findGroupsByTeamId).toHaveBeenCalledWith(TEAM_ID);
		});
	});

	describe("editMonitor", () => {
		it("updates monitor and refreshes job", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const updatedMonitor = makeMonitor({ name: "Updated" });
			(monitorsRepository.updateById as jest.Mock).mockResolvedValue(updatedMonitor);
			const { service, jobQueue } = createService({ monitorsRepository });

			const result = await service.editMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID, body: { name: "Updated" } });

			expect(result).toMatchObject({ name: "Updated" });
			expect(monitorsRepository.updateById).toHaveBeenCalledWith(MONITOR_ID, TEAM_ID, { name: "Updated" });
			expect(jobQueue.updateJob).toHaveBeenCalledWith(updatedMonitor);
		});
	});

	describe("updateNotifications", () => {
		it("updates notifications and refreshes jobs when modifiedCount > 0", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitors = [makeMonitor({ id: "m1" }), makeMonitor({ id: "m2" })];
			(monitorsRepository.updateNotifications as jest.Mock).mockResolvedValue(2);
			(monitorsRepository.findByIds as jest.Mock).mockResolvedValue(monitors);
			const { service, jobQueue } = createService({ monitorsRepository });

			const result = await service.updateNotifications({
				teamId: TEAM_ID,
				monitorIds: ["m1", "m2"],
				notificationIds: ["n1"],
				action: "add",
			});

			expect(result).toBe(2);
			expect(monitorsRepository.findByIds).toHaveBeenCalledWith(["m1", "m2"]);
			expect(jobQueue.updateJob).toHaveBeenCalledTimes(2);
		});

		it("skips job refresh when modifiedCount is 0", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.updateNotifications as jest.Mock).mockResolvedValue(0);
			const { service, jobQueue } = createService({ monitorsRepository });

			const result = await service.updateNotifications({
				teamId: TEAM_ID,
				monitorIds: ["m1"],
				notificationIds: ["n1"],
				action: "remove",
			});

			expect(result).toBe(0);
			expect(monitorsRepository.findByIds).not.toHaveBeenCalled();
			expect(jobQueue.updateJob).not.toHaveBeenCalled();
		});
	});

	describe("pauseMonitor", () => {
		it("resumes job when monitor is active after toggle", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor({ isActive: true });
			(monitorsRepository.togglePauseById as jest.Mock).mockResolvedValue(monitor);
			const { service, jobQueue } = createService({ monitorsRepository });

			const result = await service.pauseMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(result.isActive).toBe(true);
			expect(jobQueue.resumeJob).toHaveBeenCalledWith(monitor);
			expect(jobQueue.pauseJob).not.toHaveBeenCalled();
		});

		it("pauses job when monitor is inactive after toggle", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitor = makeMonitor({ isActive: false });
			(monitorsRepository.togglePauseById as jest.Mock).mockResolvedValue(monitor);
			const { service, jobQueue } = createService({ monitorsRepository });

			const result = await service.pauseMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(result.isActive).toBe(false);
			expect(jobQueue.pauseJob).toHaveBeenCalledWith(monitor);
			expect(jobQueue.resumeJob).not.toHaveBeenCalled();
		});
	});

	describe("deleteMonitor", () => {
		it("deletes monitor and all associated data", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(5);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(1);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(2);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(3);

			const { service, jobQueue } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
			});

			const result = await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(result).toEqual(monitor);
			expect(monitorStatsRepository.deleteByMonitorId).toHaveBeenCalledWith(MONITOR_ID);
			expect(checksRepository.deleteByMonitorId).toHaveBeenCalledWith(MONITOR_ID);
			expect(statusPagesRepository.removeMonitorFromStatusPages).toHaveBeenCalledWith(MONITOR_ID);
			expect(incidentsRepository.deleteByMonitorId).toHaveBeenCalledWith(MONITOR_ID, TEAM_ID);
			expect(geoChecksRepository.deleteByMonitorId).toHaveBeenCalledWith(MONITOR_ID);
			expect(jobQueue.deleteJob).toHaveBeenCalledWith(monitor);
		});

		it("logs warning when monitorStats deletion fails with Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockRejectedValue(new Error("stats error"));
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting monitor stats"),
					stack: expect.any(String),
				})
			);
		});

		it("logs warning with undefined stack when monitorStats deletion fails with non-Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockRejectedValue("string error");
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting monitor stats"),
					stack: undefined,
				})
			);
		});

		it("logs warning when checks deletion fails with Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockRejectedValue(new Error("checks error"));
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting checks"),
					stack: expect.any(String),
				})
			);
		});

		it("logs warning when checks deletion fails with non-Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockRejectedValue(42);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting checks"),
					stack: undefined,
				})
			);
		});

		it("logs warning when status pages removal fails with Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockRejectedValue(new Error("status pages error"));
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error removing monitor"),
					stack: expect.any(String),
				})
			);
		});

		it("logs warning when status pages removal fails with non-Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockRejectedValue("oops");
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error removing monitor"),
					stack: undefined,
				})
			);
		});

		it("logs warning when incidents deletion fails with Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockRejectedValue(new Error("incidents error"));
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting incidents"),
					stack: expect.any(String),
				})
			);
		});

		it("logs warning when incidents deletion fails with non-Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockRejectedValue(null);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting incidents"),
					stack: undefined,
				})
			);
		});

		it("logs warning when geo checks deletion fails with Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockRejectedValue(new Error("geo error"));

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting geo checks"),
					stack: expect.any(String),
				})
			);
		});

		it("logs warning when geo checks deletion fails with non-Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const incidentsRepository = createIncidentsRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitor = makeMonitor();
			(monitorsRepository.deleteById as jest.Mock).mockResolvedValue(monitor);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(incidentsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockRejectedValue({ code: 500 });

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository,
				geoChecksRepository,
				logger,
			});

			await service.deleteMonitor({ teamId: TEAM_ID, monitorId: MONITOR_ID });

			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting geo checks"),
					stack: undefined,
				})
			);
		});
	});

	describe("deleteAllMonitors", () => {
		it("deletes all monitors and associated data", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitors = [makeMonitor({ id: "m1" }), makeMonitor({ id: "m2" })];
			(monitorsRepository.deleteByTeamId as jest.Mock).mockResolvedValue({ monitors, deletedCount: 2 });
			(checksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(geoChecksRepository.deleteByMonitorId as jest.Mock).mockResolvedValue(0);
			(statusPagesRepository.removeMonitorFromStatusPages as jest.Mock).mockResolvedValue(0);
			(monitorStatsRepository.deleteByMonitorId as jest.Mock).mockResolvedValue({});

			const { service, jobQueue } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				geoChecksRepository,
			});

			const result = await service.deleteAllMonitors({ teamId: TEAM_ID });

			expect(result).toBe(2);
			expect(jobQueue.deleteJob).toHaveBeenCalledTimes(2);
			expect(checksRepository.deleteByMonitorId).toHaveBeenCalledTimes(2);
			expect(geoChecksRepository.deleteByMonitorId).toHaveBeenCalledTimes(2);
			expect(statusPagesRepository.removeMonitorFromStatusPages).toHaveBeenCalledTimes(2);
			expect(monitorStatsRepository.deleteByMonitorId).toHaveBeenCalledTimes(2);
		});

		it("logs warning when associated record deletion fails with Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitors = [makeMonitor({ id: "m1" })];
			(monitorsRepository.deleteByTeamId as jest.Mock).mockResolvedValue({ monitors, deletedCount: 1 });
			(checksRepository.deleteByMonitorId as jest.Mock).mockRejectedValue(new Error("fail"));

			const logger = createMockLogger();
			const { service } = createService({
				monitorsRepository,
				checksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				geoChecksRepository,
				logger,
			});

			const result = await service.deleteAllMonitors({ teamId: TEAM_ID });

			expect(result).toBe(1);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting associated records"),
					stack: expect.any(String),
				})
			);
		});

		it("logs warning when associated record deletion fails with non-Error", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const checksRepository = createChecksRepositoryMock();
			const monitorStatsRepository = createMonitorStatsRepositoryMock();
			const statusPagesRepository = createStatusPagesRepositoryMock();
			const geoChecksRepository = createGeoChecksRepositoryMock();

			const monitors = [makeMonitor({ id: "m1" })];
			(monitorsRepository.deleteByTeamId as jest.Mock).mockResolvedValue({ monitors, deletedCount: 1 });
			// deleteJob throws non-Error
			const jobQueue = createJobQueueMock();
			(jobQueue.deleteJob as jest.Mock).mockRejectedValue("string error");

			const logger = createMockLogger();
			const service = new MonitorService({
				jobQueue: jobQueue as any,
				logger: logger as any,
				games: {} as any,
				monitorsRepository,
				checksRepository,
				geoChecksRepository,
				monitorStatsRepository,
				statusPagesRepository,
				incidentsRepository: createIncidentsRepositoryMock(),
			});

			const result = await service.deleteAllMonitors({ teamId: TEAM_ID });

			expect(result).toBe(1);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("Error deleting associated records"),
					stack: undefined,
				})
			);
		});

		it("handles empty monitors array", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.deleteByTeamId as jest.Mock).mockResolvedValue({ monitors: [], deletedCount: 0 });
			const { service } = createService({ monitorsRepository });

			const result = await service.deleteAllMonitors({ teamId: TEAM_ID });
			expect(result).toBe(0);
		});
	});

	describe("exportMonitorsToJSON", () => {
		it("returns monitors when found", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const monitors = [makeMonitor({ id: "m1" })];
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue(monitors);
			const { service } = createService({ monitorsRepository });

			const result = await service.exportMonitorsToJSON({ teamId: TEAM_ID });
			expect(result).toEqual(monitors);
		});

		it("throws when no monitors found (null)", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue(null);
			const { service } = createService({ monitorsRepository });

			await expect(service.exportMonitorsToJSON({ teamId: TEAM_ID })).rejects.toThrow("No monitors found to export.");
		});

		it("throws when monitors array is empty", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([]);
			const { service } = createService({ monitorsRepository });

			await expect(service.exportMonitorsToJSON({ teamId: TEAM_ID })).rejects.toThrow("No monitors found to export.");
		});
	});

	describe("importMonitorsFromJSON", () => {
		it("imports monitors and returns count", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const importedMonitors = [
				{ name: "Test 1", type: "http", url: "https://example.com", interval: 60000 },
				{ name: "Test 2", type: "ping", url: "https://test.com", interval: 30000 },
			];
			const createdMonitors = [makeMonitor({ id: "new1" }), makeMonitor({ id: "new2" })];
			(monitorsRepository.createMonitors as jest.Mock).mockResolvedValue(createdMonitors);
			const { service } = createService({ monitorsRepository });

			const result = await service.importMonitorsFromJSON({
				teamId: TEAM_ID,
				userId: USER_ID,
				monitors: importedMonitors as any,
			});

			expect(result.imported).toBe(2);
			expect(result.errors).toEqual([]);
		});

		it("cleans monitor fields before creating", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			const createdMonitors = [makeMonitor({ id: "new1" })];
			(monitorsRepository.createMonitors as jest.Mock).mockResolvedValue(createdMonitors);
			const { service } = createService({ monitorsRepository });

			await service.importMonitorsFromJSON({
				teamId: TEAM_ID,
				userId: USER_ID,
				monitors: [{ name: "Test", type: "http", url: "https://example.com", interval: 60000 }] as any,
			});

			const callArg = (monitorsRepository.createMonitors as jest.Mock).mock.calls[0]![0] as any[];
			expect(callArg[0]).toMatchObject({
				teamId: TEAM_ID,
				userId: USER_ID,
				id: "",
				recentChecks: [],
				createdAt: "",
				updatedAt: "",
			});
		});
	});
});
