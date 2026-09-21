import { Resolver } from "dns/promises";
import axios from "axios";
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
import { INetworkService, NetworkService } from "@/service/networkService.js";
import { IBufferService, BufferService } from "@/service/bufferService.js";
import { IStatusService, StatusService } from "@/service/statusService.js";
import { SecretsRotationService } from "@/service/encryption/secretsRotationService.js";
import { IQueueWorker, JobHandlers } from "@/worker/worker.interface.js";
import { WorkerHelper } from "@/worker/worker.helper.js";
import { GeoChecksPipeline } from "@/worker/worker.geo-pipeline.js";
import { NotificationReactor } from "@/worker/reactors/reactor.notification.js";
import { IncidentReactor } from "@/worker/reactors/reactor.incident.js";
import { ReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { DBQueueWorker } from "@/worker/worker.db-queue.js";
import { ProxyResolver } from "@/service/network/ProxyResolver.js";
import { IEgressService, EgressService } from "@/domain/egress/egress.service.js";
// Network providers
import { PingProvider } from "@/service/network/PingProvider.js";
import { HttpProvider } from "@/service/network/HttpProvider.js";
import { AdvancedMatcher } from "@/service/network/AdvancedMatcher.js";
import { PageSpeedProvider } from "@/service/network/PageSpeedProvider.js";
import { HardwareProvider } from "@/service/network/HardwareProvider.js";
import { DockerProvider } from "@/service/network/DockerProvider.js";
import { PortProvider } from "@/service/network/PortProvider.js";
import { GameProvider } from "@/service/network/GameProvider.js";
import { GrpcProvider } from "@/service/network/GrpcProvider.js";
import { WebSocketProvider } from "@/service/network/WebSocketProvider.js";
import { DNSProvider } from "@/service/network/DNSProvider.js";
import { AppError } from "@/utils/AppError.js";
import { WorkerPipeline } from "@/worker/worker.pipeline.js";
export interface WorkerServices {
	worker: IQueueWorker;
	networkService: INetworkService;
	bufferService: IBufferService;
	statusService: IStatusService;
	egressService: IEgressService;
}

export const buildWorker = async (shared: SharedServices, envSettings: EnvConfig): Promise<WorkerServices> => {
	const {
		logger,
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
		egressStateRepository,
	} = shared;

	// ***********************
	// Network providers
	// ***********************
	const pingProvider = new PingProvider(ping, net);
	const httpProvider = new HttpProvider(got, new AdvancedMatcher(jmespath));
	const pageSpeedProvider = new PageSpeedProvider(httpProvider, settingsService, logger);
	const hardwareProvider = new HardwareProvider(httpProvider);
	const dockerProvider = new DockerProvider(logger, Docker, encryptionService);
	const portProvider = new PortProvider(net);
	const gameProvider = new GameProvider(logger, GameDig);
	const grpcProvider = new GrpcProvider(grpc, protoLoader);
	const webSocketProvider = new WebSocketProvider(WebSocket);
	const dnsProvider = new DNSProvider(() => new Resolver());

	const networkService = new NetworkService(axios, logger, [
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
	]);

	const proxyResolver = new ProxyResolver(proxiesRepository, settingsService, logger);
	const bufferService = new BufferService(logger, geoChecksService, dockerLogsService, settingsService, (checks): Promise<void> =>
		pipeline.ingestChecks(checks)
	);
	const statusService = new StatusService(logger, monitorsRepository, monitorStatsRepository);
	const egressService = new EgressService(settingsService, egressStateRepository, jobsRepository, networkService, proxyResolver, logger);

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
		networkService,
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
		egressService
	);

	const handlers: JobHandlers = {
		check: pipeline.handleCheck,
		evaluate: pipeline.handleEvaluate,
		"geo-check": geoCheckPipeline.handle,
		"cleanup-orphaned": workerHelper.getCleanupOrphanedJob(),
		"cleanup-retention": workerHelper.getCleanupRetentionJob(),
		egress: workerHelper.getEgressRecoveryJob(),
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
	});

	const secretsRotationService = new SecretsRotationService(monitorsRepository, encryptionService, logger);
	try {
		const result = await secretsRotationService.run();
		logger.debug({
			message: "Secrets rotation run successfully",
			service: "WorkerServices",
			method: "buildWorker",
			details: { ...result },
		});
	} catch (error: unknown) {
		logger.warn({
			message: `Could not rotate Docker TLS secrets: ${error instanceof Error ? error.message : String(error)}`,
			service: "WorkerServices",
			method: "buildWorker",
			details: { ...(error instanceof AppError ? error.details : {}) },
		});
	}

	return { worker, networkService, bufferService, statusService, egressService };
};
