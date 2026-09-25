import { jest } from "@jest/globals";
import { WorkerPipeline } from "../../src/worker/worker.pipeline.ts";
import { NotificationReactor } from "../../src/worker/reactors/reactor.notification.ts";
import { IncidentReactor } from "../../src/worker/reactors/reactor.incident.ts";
import { ReactorDispatcher } from "../../src/worker/reactors/reactor.dispatcher.ts";
import { StatusService } from "../../src/service/statusService.ts";
import { IncidentService } from "../../src/domain/incidents/incident.service.ts";
import { CheckService } from "../../src/domain/checks/check.service.ts";
import { InMemoryMonitorsRepository } from "./InMemoryMonitorsRepository.ts";
import { InMemoryIncidentsRepository } from "./InMemoryIncidentsRepository.ts";
import { createMockLogger } from "./createMockLogger.ts";
import type { Monitor } from "../../src/domain/monitors/monitor.type.ts";
import type { Check } from "../../src/domain/checks/check.type.ts";
import type { MonitorActionDecision } from "../../src/worker/worker.interface.ts";
import type { MonitorStatusResponse } from "../../src/types/network.ts";
import type { MaintenanceWindow } from "../../src/domain/maintenance-windows/maintenance-window.type.ts";
import type { EgressStatus } from "../../src/domain/egress/egress.type.ts";

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

const createStubMonitorStatsRepo = () => ({
	findByMonitorId: jest.fn().mockRejectedValue(new Error("no stats")),
	create: jest.fn().mockResolvedValue({}),
	updateByMonitorId: jest.fn().mockResolvedValue({}),
	deleteByMonitorId: jest.fn(),
	deleteByMonitorIds: jest.fn(),
	deleteByMonitorIdsNotIn: jest.fn(),
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
	messageBuilder: { buildThresholdBreachMessage: jest.Mock };
	egressService: { assessAfterFailure: jest.Mock };
	heartbeatJob: (monitor: Monitor) => Promise<void>;
	setNextResponse: (status: boolean, code: number) => void;
	setNextResponseFull: (response: MonitorStatusResponse) => void;
	setEgressStatus: (status: EgressStatus | null) => void;
}

export function createHeartbeatTestHarness(): HeartbeatTestHarness {
	const monitorsRepo = new InMemoryMonitorsRepository();
	const incidentsRepo = new InMemoryIncidentsRepository();
	const logger = createMockLogger() as any;
	const bufferStub = { addToBuffer: jest.fn(), addGeoCheckToBuffer: jest.fn(), scheduleNextFlush: jest.fn() };

	const statusService = new StatusService(logger, monitorsRepo as any, createStubMonitorStatsRepo() as any);

	const messageBuilder = { buildThresholdBreachMessage: jest.fn().mockReturnValue("") };
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
	// The real mapper, so the stored check carries the hardware/docker payload the evaluator reads.
	// Only toCheck is reached; the repositories are never touched.
	const checkService = new CheckService(monitorsRepo as any, logger, {} as any);

	const setNextResponse = (status: boolean, code: number) => {
		nextResponse = null;
		nextStatus = status;
		nextCode = code;
	};

	const setNextResponseFull = (response: MonitorStatusResponse) => {
		nextResponse = response;
	};

	const maintenanceWindowsRepo = { findByMonitorId: jest.fn().mockResolvedValue([]) };
	const proxyResolver = { resolve: jest.fn().mockResolvedValue(undefined) };
	const dockerLogsService = { buildDockerLogs: jest.fn().mockResolvedValue([]) };
	// Null mirrors the egress check being disabled, so the existing heartbeat suites run unchanged.
	let nextEgressStatus: EgressStatus | null = null;
	const egressService = { assessAfterFailure: jest.fn().mockImplementation(() => Promise.resolve(nextEgressStatus)) };
	const setEgressStatus = (status: EgressStatus | null) => {
		nextEgressStatus = status;
	};

	// The real NotificationsService ignores decisions with no transition; the stub is reached only for the ones it
	// would act on, so tests can assert on handleNotifications calls as "notifications sent".
	const guardedNotificationsService = {
		handleNotifications: (monitor: Monitor, check: Check, decision: MonitorActionDecision) =>
			decision.transition !== null ? notificationsService.handleNotifications(monitor, check, decision) : Promise.resolve(false),
	};
	const notificationReactor = new NotificationReactor(guardedNotificationsService as any);
	const incidentReactor = new IncidentReactor(incidentService as any);
	const reactorDispatcher = new ReactorDispatcher(logger, [notificationReactor, incidentReactor]);

	// The harness drives stages 1 and 3 directly, so the stage 2 repositories are never reached.
	const pipeline = new WorkerPipeline({
		logger,
		monitorsRepository: monitorsRepo as any,
		maintenanceWindowsRepository: maintenanceWindowsRepo as any,
		checksRepository: { findUnevaluatedByMonitorId: jest.fn() } as any,
		jobsRepository: { upsertEvaluate: jest.fn(), pullEvaluated: jest.fn() } as any,
		checkService: checkService as any,
		networkService: networkService as any,
		proxyResolver: proxyResolver as any,
		bufferService: bufferStub as any,
		dockerLogsService: dockerLogsService as any,
		egressService: egressService as any,
		statusService,
		dispatcher: reactorDispatcher,
	});

	// Mirror the production check→evaluate flow: read the monitor fresh each cycle (so the
	// accumulated statusWindow is visible), produce a check, then evaluate against that monitor.
	const heartbeatJob = async (seedMonitor: Monitor) => {
		const monitor = await monitorsRepo.findByIdLean(seedMonitor.id);
		if (!monitor) return;
		const result = await pipeline.produce(monitor);
		if (!result) return; // skipped (e.g. maintenance window)
		const evaluation = await pipeline.evaluateCheck(result.check, monitor);
		await reactorDispatcher.dispatch(evaluation);
	};

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
		egressService,
		heartbeatJob,
		setNextResponse,
		setNextResponseFull,
		setEgressStatus,
	};
}
