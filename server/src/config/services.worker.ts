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
import { IQueueWorker } from "@/worker/worker.interface.js";
import { MonitorStatusPolicy } from "@/worker/worker.monitor-status-policy.js";
import { WorkerHelper } from "@/worker/worker.helper.js";
import { CheckProducer } from "@/worker/worker.check-producer.js";
import { CheckEvaluator } from "@/worker/worker.check-evaluator.js";
import { GeoChecksPipeline } from "@/worker/worker.check-pipeline.js";
import { NotificationReactor } from "@/worker/reactors/reactor.notification.js";
import { IncidentReactor } from "@/worker/reactors/reactor.incident.js";
import { ReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { DBQueueWorker } from "@/worker/worker.db-queue.js";

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
export interface WorkerServices {
	worker: IQueueWorker;
	networkService: INetworkService;
	bufferService: IBufferService;
	statusService: IStatusService;
}

export const buildWorker = async (shared: SharedServices, envSettings: EnvConfig): Promise<WorkerServices> => {
	const {
		logger,
		settingsService,
		checkService,
		geoChecksService,
		notificationsService,
		incidentService,
		workerId,
		jobsRepository,
		queueWorkersRepository,
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		incidentsRepository,
		teamsRepository,
		maintenanceWindowsRepository,
	} = shared;

	// ***********************
	// Network providers
	// ***********************
	const pingProvider = new PingProvider(ping);
	const httpProvider = new HttpProvider(got, new AdvancedMatcher(jmespath));
	const pageSpeedProvider = new PageSpeedProvider(httpProvider, settingsService, logger);
	const hardwareProvider = new HardwareProvider(httpProvider);
	const dockerProvider = new DockerProvider(logger, Docker);
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

	const bufferService = new BufferService(logger, checkService, geoChecksService, settingsService, jobsRepository);
	const statusService = new StatusService(logger, monitorsRepository, monitorStatsRepository);
	const monitorStatusPolicy = new MonitorStatusPolicy();

	// ***********************
	// Reactors and dispatcher
	// Handles notifications and incidents
	// ***********************

	const notificationReactor = new NotificationReactor(notificationsService);
	const incidentReactor = new IncidentReactor(incidentService);
	const reactorDispatcher = new ReactorDispatcher(logger, [notificationReactor, incidentReactor]);

	// ***********************
	// Check producer/evaluator
	// Handles creating and evaluatiog checks
	// ***********************
	const checkProducer = new CheckProducer(monitorsRepository, maintenanceWindowsRepository, checkService, networkService, bufferService, logger);
	const checkEvaluator = new CheckEvaluator(statusService, monitorStatusPolicy);
	const geoCheckPipeline = new GeoChecksPipeline(maintenanceWindowsRepository, geoChecksService, bufferService, logger);

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
		geoChecksRepository
	);

	const worker = await DBQueueWorker.create({
		logger,
		isDbConnected: () => mongoose.connection.readyState === 1,
		jobsRepository,
		monitorsRepository,
		checksRepository,
		checkService,
		bufferService,
		checkProducer,
		checkEvaluator,
		geoCheckPipeline,
		dispatcher: reactorDispatcher,
		helper: workerHelper,
		queueWorkersRepository,
		queueMode: envSettings.queueMode,
		queuePrimaryProcesses: envSettings.queuePrimaryProcesses,
		workerId,
	});

	return { worker, networkService, bufferService, statusService };
};
