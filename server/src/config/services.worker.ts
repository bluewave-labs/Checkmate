import { Resolver } from "dns/promises";
import { execFile, spawn } from "node:child_process";
import got from "got";
import ping from "ping";
import Docker from "dockerode";
import net from "net";
import { GameDig } from "gamedig";
import jmespath from "jmespath";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import WebSocket from "ws";
import mongoose from "mongoose";

import { EnvConfig } from "@/domain/app-settings/app-settings.service.js";
import { SharedServices } from "@/config/services.shared.js";
import { IProviderRegistry, ProviderRegistry } from "@/service/networkProviders/providerRegistry.js";
import { IBufferService, BufferService } from "@/service/bufferService.js";
import { IStatusService, StatusService } from "@/service/statusService.js";
import { SecretsRotationService } from "@/service/encryption/secretsRotationService.js";
import { TelemetryService } from "@/domain/telemetry/telemetry.service.js";
import { ConnectHeartbeatService } from "@/domain/connect/connect-heartbeat.service.js";
import { ConnectBackupTools } from "@/domain/connect/connect.backup-tools.js";
import { ConnectToolsService } from "@/domain/connect/connect-tools.service.js";
import { ConnectApiService } from "@/domain/connect/connect-api.service.js";
import { ConnectBackupService } from "@/domain/connect/connect-backup.service.js";
import { ConnectOperationService } from "@/domain/connect/connect-operation.service.js";
import { IQueueWorker, JobHandlers } from "@/worker/worker.interface.js";
import { WorkerHelper } from "@/worker/worker.helper.js";
import { GeoChecksPipeline } from "@/worker/worker.geo-pipeline.js";
import { NotificationReactor } from "@/worker/reactors/reactor.notification.js";
import { IncidentReactor } from "@/worker/reactors/reactor.incident.js";
import { ReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { DBQueueWorker } from "@/worker/worker.db-queue.js";
import { ProxyResolver } from "@/service/networkProviders/ProxyResolver.js";
import { IEgressService, EgressService } from "@/domain/egress/egress.service.js";
// Network providers
import { PingProvider } from "@/service/networkProviders/PingProvider.js";
import { HttpProvider } from "@/service/networkProviders/HttpProvider.js";
import { AdvancedMatcher } from "@/service/networkProviders/AdvancedMatcher.js";
import { PageSpeedProvider } from "@/service/networkProviders/PageSpeedProvider.js";
import { HardwareProvider } from "@/service/networkProviders/HardwareProvider.js";
import { DockerProvider } from "@/service/networkProviders/DockerProvider.js";
import { PortProvider } from "@/service/networkProviders/PortProvider.js";
import { GameProvider } from "@/service/networkProviders/GameProvider.js";
import { GrpcProvider } from "@/service/networkProviders/GrpcProvider.js";
import { WebSocketProvider } from "@/service/networkProviders/WebSocketProvider.js";
import { DNSProvider } from "@/service/networkProviders/DNSProvider.js";
import { HeartbeatProvider } from "@/service/networkProviders/HeartbeatProvider.js";
import { WorkerPipeline } from "@/worker/worker.pipeline.js";
export interface WorkerServices {
	worker: IQueueWorker;
	networkService: IProviderRegistry;
	bufferService: IBufferService;
	statusService: IStatusService;
	egressService: IEgressService;
}

export const buildWorker = async (shared: SharedServices, envSettings: EnvConfig): Promise<WorkerServices> => {
	const {
		logger,
		db,
		settingsService,
		checkService,
		geoChecksService,
		dockerLogsService,
		notificationsService,
		incidentService,
		workerId,
		jobsRepository,
		queueWorkersRepository,
		monitorsRepository,
		encryptionService,
		checksRepository,
		geoChecksRepository,
		dockerLogsRepository,
		monitorStatsRepository,
		incidentsRepository,
		teamsRepository,
		maintenanceWindowsRepository,
		proxiesRepository,
		connectRepository,
		settingsRepository,
	} = shared;

	// ***********************
	// Network providers
	// ***********************
	const pingProvider = new PingProvider(ping, net);
	const httpProvider = new HttpProvider(got, new AdvancedMatcher(jmespath));
	const pageSpeedProvider = new PageSpeedProvider(httpProvider, settingsService, logger);
	const hardwareProvider = new HardwareProvider(httpProvider);
	const dockerProvider = new DockerProvider(logger, Docker, encryptionService, httpProvider);
	const portProvider = new PortProvider(net);
	const gameProvider = new GameProvider(logger, GameDig);
	const grpcProvider = new GrpcProvider(grpc, protoLoader);
	const webSocketProvider = new WebSocketProvider(WebSocket);
	const dnsProvider = new DNSProvider(() => new Resolver());
	const heartbeatProvider = new HeartbeatProvider();

	const providerRegistry = new ProviderRegistry([
		pingProvider,
		httpProvider,
		pageSpeedProvider,
		hardwareProvider,
		dockerProvider,
		portProvider,
		gameProvider,
		grpcProvider,
		webSocketProvider,
		dnsProvider,
		heartbeatProvider,
	]);

	const proxyResolver = new ProxyResolver(proxiesRepository, settingsService, logger);
	const bufferService = new BufferService(logger, geoChecksService, dockerLogsService, settingsService, (checks): Promise<void> =>
		pipeline.ingestChecks(checks)
	);
	const statusService = new StatusService(logger, monitorsRepository, monitorStatsRepository);
	const egressService = new EgressService(settingsService, workerId, queueWorkersRepository, providerRegistry, proxyResolver, logger);
	const telemetryService = new TelemetryService(got, settingsService, settingsRepository, monitorsRepository, logger);
	const connectHeartbeatService = new ConnectHeartbeatService(got, connectRepository, encryptionService, logger);
	const connectBackupTools = new ConnectBackupTools(spawn, execFile, settingsService, logger);
	const connectToolsService = new ConnectToolsService(connectBackupTools, queueWorkersRepository, workerId, logger);
	const connectApiService = new ConnectApiService(got, settingsService, logger);
	const connectBackupService = new ConnectBackupService(connectBackupTools, connectApiService, connectRepository, db, logger);
	const connectOperationService = new ConnectOperationService(
		connectRepository,
		encryptionService,
		connectBackupService,
		connectToolsService,
		logger
	);

	const notificationReactor = new NotificationReactor(notificationsService);
	const incidentReactor = new IncidentReactor(incidentService);
	const reactorDispatcher = new ReactorDispatcher(logger, [notificationReactor, incidentReactor]);

	const pipeline = new WorkerPipeline({
		logger,
		monitorsRepository,
		maintenanceWindowsRepository,
		checksRepository,
		jobsRepository,
		checkService,
		providerRegistry: providerRegistry,
		proxyResolver,
		bufferService,
		dockerLogsService,
		egressService,
		statusService,
		dispatcher: reactorDispatcher,
	});

	const geoCheckPipeline = new GeoChecksPipeline(monitorsRepository, maintenanceWindowsRepository, geoChecksService, bufferService, logger);

	// ***********************
	// Worker
	// ***********************

	const workerHelper = new WorkerHelper(
		logger,
		checkService,
		settingsService,
		monitorsRepository,
		jobsRepository,
		teamsRepository,
		monitorStatsRepository,
		checksRepository,
		incidentsRepository,
		geoChecksRepository,
		dockerLogsRepository,
		telemetryService,
		connectHeartbeatService
	);

	const handlers: JobHandlers = {
		check: pipeline.handleCheck,
		evaluate: pipeline.handleEvaluate,
		"geo-check": geoCheckPipeline.handle,
		"cleanup-orphaned": workerHelper.getCleanupOrphanedJob(),
		"cleanup-retention": workerHelper.getCleanupRetentionJob(),
		telemetry: workerHelper.getTelemetryJob(),
		"connect-heartbeat": workerHelper.getConnectHeartbeatJob(),
		"connect-operation": connectOperationService.handleJob,
	};

	const worker = await DBQueueWorker.create({
		logger,
		isDbConnected: () => mongoose.connection.readyState === 1,
		jobsRepository,
		monitorsRepository,
		bufferService,
		handlers,
		queueWorkersRepository,
		queueMode: envSettings.queueMode,
		queuePrimaryProcesses: envSettings.queuePrimaryProcesses,
		workerId,
		telemetryEnabled: envSettings.telemetryEnabled,
		afterHeartbeat: connectToolsService.report,
	});

	const secretsRotationService = new SecretsRotationService(monitorsRepository, connectRepository, encryptionService, logger);
	const log = logger.child({ service: "WorkerServices" }); // this function's own lines; services above get the root logger
	try {
		const result = await secretsRotationService.run();
		log.debug({ ...result }, "Secrets rotation run successfully");
	} catch (error: unknown) {
		log.warn({ err: error }, "Could not rotate encrypted secrets");
	}

	return { worker, networkService: providerRegistry, bufferService, statusService, egressService };
};
