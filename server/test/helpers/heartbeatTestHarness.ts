import { jest } from "@jest/globals";
import { SuperSimpleQueueHelper } from "../../src/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.ts";
import { StatusService } from "../../src/service/infrastructure/statusService.ts";
import { IncidentService } from "../../src/service/business/incidentService.ts";
import { InMemoryMonitorsRepository } from "./InMemoryMonitorsRepository.ts";
import { InMemoryIncidentsRepository } from "./InMemoryIncidentsRepository.ts";
import { createMockLogger } from "./createMockLogger.ts";
import type { Monitor } from "../../src/types/monitor.ts";
import type { MonitorStatusResponse } from "../../src/types/network.ts";
import type { Check } from "../../src/types/check.ts";
import type { MaintenanceWindow } from "../../src/types/maintenanceWindow.ts";

let checkCounter = 0;

export const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		name: "Test Monitor",
		type: "http",
		url: "https://example.com",
		status: "up",
		// Pre-fill window so threshold evaluation runs immediately.
		// Without this, the warm-up path sets monitor.status directly
		// from each check, bypassing the threshold logic.
		statusWindow: [true, true, true, true, true],
		statusWindowSize: 5,
		statusWindowThreshold: 60,
		recentChecks: [],
		notifications: [],
		...overrides,
	}) as Monitor;

export const makeStatusResponse = (status: boolean, code: number): MonitorStatusResponse => ({
	monitorId: "mon-1",
	teamId: "team-1",
	type: "http",
	status,
	code,
	message: status ? "OK" : "Service Unavailable",
	responseTime: status ? 150 : 0,
});

export const makeCheck = (status: boolean, code: number): Check => {
	const now = new Date().toISOString();
	return {
		id: `check-${++checkCounter}`,
		metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" },
		status,
		statusCode: code,
		responseTime: status ? 150 : 0,
		message: status ? "OK" : "Service Unavailable",
		createdAt: now,
		updatedAt: now,
	};
};

const createStubMonitorStatsRepo = () => ({
	findByMonitorId: jest.fn().mockRejectedValue(new Error("no stats")),
	create: jest.fn().mockResolvedValue({}),
	updateByMonitorId: jest.fn().mockResolvedValue({}),
	deleteByMonitorId: jest.fn(),
	deleteByMonitorIds: jest.fn(),
	deleteByMonitorIdsNotIn: jest.fn(),
});

const createStubChecksRepo = () => ({
	create: jest.fn(),
	createChecks: jest.fn(),
	findByMonitorId: jest.fn(),
	findByTeamId: jest.fn(),
	findLatestByMonitorIds: jest.fn(),
	findByDateRangeAndMonitorId: jest.fn(),
	findSummaryByTeamId: jest.fn(),
	deleteByMonitorId: jest.fn(),
	deleteByTeamId: jest.fn(),
	deleteByMonitorIdsNotIn: jest.fn(),
	deleteOlderThan: jest.fn(),
});

export interface HeartbeatTestHarness {
	monitorsRepo: InMemoryMonitorsRepository;
	incidentsRepo: InMemoryIncidentsRepository;
	statusService: StatusService;
	incidentService: IncidentService;
	notificationsService: { handleNotifications: jest.Mock };
	networkService: { requestStatus: jest.Mock };
	bufferStub: { addToBuffer: jest.Mock; addGeoCheckToBuffer: jest.Mock; scheduleNextFlush: jest.Mock };
	maintenanceWindowsRepo: { findByMonitorId: jest.Mock };
	messageBuilder: { extractThresholdBreaches: jest.Mock };
	heartbeatJob: (monitor: Monitor) => Promise<void>;
	setNextResponse: (status: boolean, code: number) => void;
	setNextResponseFull: (response: MonitorStatusResponse) => void;
}

export function createHeartbeatTestHarness(): HeartbeatTestHarness {
	checkCounter = 0;

	const monitorsRepo = new InMemoryMonitorsRepository();
	const incidentsRepo = new InMemoryIncidentsRepository();
	const logger = createMockLogger() as any;
	const bufferStub = { addToBuffer: jest.fn(), addGeoCheckToBuffer: jest.fn(), scheduleNextFlush: jest.fn() };

	const statusService = new StatusService(
		logger,
		bufferStub as any,
		monitorsRepo as any,
		createStubMonitorStatsRepo() as any,
		createStubChecksRepo() as any
	);

	const messageBuilder = { extractThresholdBreaches: jest.fn().mockReturnValue([]) };
	const incidentService = new IncidentService(logger, incidentsRepo, monitorsRepo as any, { findById: jest.fn() } as any, messageBuilder as any);

	const notificationsService = { handleNotifications: jest.fn().mockResolvedValue(true) };

	let nextResponse: MonitorStatusResponse | null = null;
	let nextStatus = true;
	let nextCode = 200;
	const networkService = {
		requestStatus: jest.fn().mockImplementation(() => {
			if (nextResponse) {
				return Promise.resolve(nextResponse);
			}
			return Promise.resolve(makeStatusResponse(nextStatus, nextCode));
		}),
	};
	const checkService = {
		buildCheck: jest.fn().mockImplementation((response: MonitorStatusResponse) => {
			return makeCheck(response.status, response.code);
		}),
	};

	const setNextResponse = (status: boolean, code: number) => {
		nextResponse = null;
		nextStatus = status;
		nextCode = code;
	};

	const setNextResponseFull = (response: MonitorStatusResponse) => {
		nextResponse = response;
	};

	const maintenanceWindowsRepo = { findByMonitorId: jest.fn().mockResolvedValue([]) };

	const helper = new SuperSimpleQueueHelper(
		logger,
		networkService as any,
		statusService as any,
		notificationsService as any,
		checkService as any,
		{ getDBSettings: jest.fn() } as any,
		bufferStub as any,
		incidentService as any,
		maintenanceWindowsRepo as any,
		monitorsRepo as any,
		{ findAllTeamIds: jest.fn() } as any,
		createStubMonitorStatsRepo() as any,
		createStubChecksRepo() as any,
		incidentsRepo as any,
		{ buildGeoCheck: jest.fn() } as any,
		{ deleteByMonitorIdsNotIn: jest.fn() } as any
	);

	return {
		monitorsRepo,
		incidentsRepo,
		statusService,
		incidentService,
		notificationsService,
		networkService,
		bufferStub,
		maintenanceWindowsRepo,
		messageBuilder,
		heartbeatJob: helper.getHeartbeatJob(),
		setNextResponse,
		setNextResponseFull,
	};
}
