import { jest } from "@jest/globals";
import { MonitorService } from "../src/service/business/monitorService.ts";
import type { IMonitorsRepository, IChecksRepository } from "../src/repositories/index.ts";

const createMonitorsRepositoryMock = () =>
	({
		findMonitorCountByTeamIdAndType: jest.fn(),
		findByTeamId: jest.fn(),
		findById: jest.fn(),
		create: jest.fn(),
		createBulkMonitors: jest.fn(),
		deleteByTeamId: jest.fn(),
	}) as unknown as IMonitorsRepository;

const createChecksRepositoryMock = () =>
	({
		findLatestChecksByMonitorIds: jest.fn(),
		findDateRangeChecksByMonitor: jest.fn(),
	}) as unknown as IChecksRepository;

const createService = ({
	monitorsRepository = createMonitorsRepositoryMock(),
	checksRepository = createChecksRepositoryMock(),
	monitorStatsRepository = { findByMonitorId: jest.fn() },
	monitorModuleOverrides = {},
}: {
	monitorsRepository?: IMonitorsRepository;
	checksRepository?: IChecksRepository;
	monitorStatsRepository?: { findByMonitorId: jest.Mock };
	monitorModuleOverrides?: Record<string, unknown>;
} = {}) => {
	const monitorModule = {
		getMonitorById: jest.fn().mockResolvedValue({ teamId: { equals: () => true } }),
		getMonitorStatsById: jest.fn().mockResolvedValue({ latest: {} }),
		getMonitorsByTeamId: jest.fn().mockResolvedValue([]),
		getMonitorsAndSummaryByTeamId: jest.fn().mockResolvedValue({ monitors: [], summary: {} }),
		...monitorModuleOverrides,
	};

	return new MonitorService({
		db: {
			monitorModule,
			statusPageModule: { deleteStatusPagesByMonitorId: jest.fn() },
			checkModule: { deleteChecks: jest.fn() },
			pageSpeedCheckModule: { deletePageSpeedChecksByMonitorId: jest.fn() },
			notificationsModule: { deleteNotificationsByMonitorId: jest.fn() },
		},
		jobQueue: {
			addJob: jest.fn(),
			updateJob: jest.fn(),
			resumeJob: jest.fn(),
			pauseJob: jest.fn(),
			deleteJob: jest.fn(),
		},
		stringService: {},
		emailService: { buildEmail: jest.fn(), sendEmail: jest.fn() },
		papaparse: { parse: jest.fn(), unparse: jest.fn() },
		logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
		errorService: {
			createAuthorizationError: jest.fn(() => new Error("unauthorized")),
			createServerError: jest.fn(() => new Error("server")),
			createBadRequestError: jest.fn(() => new Error("bad request")),
			createNotFoundError: jest.fn(() => new Error("not found")),
		},
		games: [],
		monitorsRepository,
		checksRepository,
		monitorStatsRepository,
	});
};

describe("MonitorService", () => {
	describe("getMonitorsWithChecksByTeamId", () => {
		it("returns monitors enriched with normalized checks", async () => {
			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findMonitorCountByTeamIdAndType as jest.Mock).mockResolvedValue(2);
			(monitorsRepository.findByTeamId as jest.Mock).mockResolvedValue([
				{ id: "m1", name: "Monitor 1", interval: 60000 },
				{ id: "m2", name: "Monitor 2", interval: 60000 },
			]);

			const checksRepository = createChecksRepositoryMock();
			(checksRepository.findLatestChecksByMonitorIds as jest.Mock).mockResolvedValue({
				m1: [
					{ responseTime: 10, status: true, message: "OK" },
					{ responseTime: 20, status: true, message: "OK" },
				],
				m2: [{ responseTime: 50, status: true, message: "OK" }],
			});

			const service = createService({ monitorsRepository, checksRepository });
			const result = await service.getMonitorsWithChecksByTeamId({ teamId: "team" });

			expect(result).toMatchObject({ count: 2 });
			expect(result.monitors).toHaveLength(2);
			expect(result.monitors[0]).toHaveProperty("checks");
			expect(result.monitors[0].checks.length).toBeGreaterThan(0);
			expect(result.monitors[0].checks[0]).toEqual(
				expect.objectContaining({
					responseTime: expect.any(Number),
					status: expect.any(Boolean),
					message: expect.any(String),
				})
			);
		});
	});

	describe("getMonitorsByTeamId", () => {
		it("returns monitors array from db module", async () => {
			const monitorsPayload = [
				{ id: "m1", name: "Monitor 1" },
				{ id: "m2", name: "Monitor 2" },
			];
			const monitorModuleOverrides = {
				getMonitorsByTeamId: jest.fn().mockResolvedValue(monitorsPayload),
			};
			const service = createService({ monitorModuleOverrides });
			const result = await service.getMonitorsByTeamId({ teamId: "team" } as any);
			expect(result).toHaveLength(2);
			expect(result[0]).toHaveProperty("id", "m1");
		});
	});

	describe("getMonitorsAndSummaryByTeamId", () => {
		it("returns monitors with summary block", async () => {
			const monitorModuleOverrides = {
				getMonitorsAndSummaryByTeamId: jest.fn().mockResolvedValue({ monitors: [{ id: "m1" }], summary: { total: 1, uptime: 0.99 } }),
			};
			const service = createService({ monitorModuleOverrides });
			const result = await service.getMonitorsAndSummaryByTeamId({ teamId: "team" });
			expect(result).toEqual({ monitors: [{ id: "m1" }], summary: { total: 1, uptime: 0.99 } });
		});
	});

	describe("getUptimeDetailsById", () => {
		it("returns monitorData and monitorStats with expected shape", async () => {
			const TEAM_ID = "team";
			const monitor = {
				id: "monitor-1",
				teamId: TEAM_ID,
				name: "Hardware monitor",
				interval: 60000,
				statusWindow: [],
				statusWindowSize: 5,
				statusWindowThreshold: 60,
				type: "http",
				ignoreTlsErrors: false,
				url: "https://example.com",
				isActive: true,
				alertThreshold: 5,
				cpuAlertThreshold: 5,
				memoryAlertThreshold: 5,
				diskAlertThreshold: 5,
				tempAlertThreshold: 5,
				selectedDisks: [],
				notifications: [],
				group: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			const monitorsRepository = createMonitorsRepositoryMock();
			(monitorsRepository.findById as jest.Mock).mockResolvedValue(monitor);
			const checksRepository = createChecksRepositoryMock();
			(checksRepository.findDateRangeChecksByMonitor as jest.Mock).mockResolvedValue({
				monitorType: "uptime",
				groupedChecks: [{ _id: "2024-01-01", avgResponseTime: 100, totalChecks: 2 }],
				groupedUpChecks: [{ _id: "2024-01-01", totalChecks: 2, avgResponseTime: 90 }],
				groupedDownChecks: [{ _id: "2024-01-01", totalChecks: 0, avgResponseTime: 0 }],
				uptimePercentage: 0.99,
				avgResponseTime: 95,
			});

			const monitorStatsRepository = {
				findByMonitorId: jest.fn().mockResolvedValue({
					id: "stats-1",
					monitorId: monitor.id,
					avgResponseTime: 90,
					totalChecks: 10,
					totalUpChecks: 9,
					totalDownChecks: 1,
					uptimePercentage: 0.9,
					lastCheckTimestamp: 123456789,
					lastResponseTime: 80,
					timeOfLastFailure: 123456700,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}),
			} as any;
			const monitorModuleOverrides = {
				getMonitorById: jest.fn().mockResolvedValue({ teamId: { equals: (value: string) => value === TEAM_ID } }),
			};

			const service = createService({ monitorsRepository, checksRepository, monitorModuleOverrides, monitorStatsRepository });
			const result = await service.getUptimeDetailsById({ teamId: TEAM_ID, monitorId: "monitor-1", dateRange: "recent" });

			expect(result).toHaveProperty("monitorData");
			expect(result.monitorData.monitor).toMatchObject({ id: monitor.id, name: monitor.name });
			expect(result.monitorData.groupedChecks[0]).toEqual(
				expect.objectContaining({
					_id: expect.any(String),
					avgResponseTime: expect.any(Number),
					totalChecks: expect.any(Number),
				})
			);
			expect(result.monitorStats).toEqual(
				expect.objectContaining({
					monitorId: monitor.id,
					avgResponseTime: 90,
					totalChecks: 10,
					totalUpChecks: 9,
					totalDownChecks: 1,
				})
			);
		});
	});
});
