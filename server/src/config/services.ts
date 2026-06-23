import { Mongoose } from "mongoose";
import { buildShared } from "@/config/services.shared.js";
import { IDb } from "@/db/db.interface.js";
import { EnvConfig, ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { DiagnosticService, IDiagnosticService } from "@/domain/diagnostics/diagnostic.service.js";
import { IGeoChecksService } from "@/domain/geo-checks/geo-check.service.js";
import { IIncidentService } from "@/domain/incidents/incident.service.js";
import { IInviteService, InviteService } from "@/domain/invites/invite.service.js";
import { IMaintenanceWindowService, MaintenanceWindowService } from "@/domain/maintenance-windows/maintenance-window.service.js";
import { IMonitorService, MonitorService } from "@/domain/monitors/monitor.service.js";
import { INotificationMessageBuilder } from "@/domain/notifications/notification.message-builder.js";
import { INotificationsService } from "@/domain/notifications/notification.service.js";
import { IStatusPageService, StatusPageService } from "@/domain/status-pages/status-page.service.js";
import { ITagsService, TagsService } from "@/domain/tags/tag.service.js";
import { IUserService, UserService } from "@/domain/users/user.service.js";
import { BufferService, IBufferService } from "@/service/bufferService.js";
import { IEmailService } from "@/service/emailService.js";
import { WorkerHelper } from "@/worker/worker.helper.js";
import { IQueueWorker } from "@/worker/worker.interface.js";
import { INetworkService, NetworkService } from "@/service/networkService.js";
import { IStatusService, StatusService } from "@/service/statusService.js";
import { MonitorStatusPolicy } from "@/worker/worker.monitor-status-policy.js";

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

// Third-party
import { Resolver } from "dns/promises";
import axios from "axios";
import got from "got";
import ping from "ping";
import Docker from "dockerode";
import net from "net";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { games, GameDig } from "gamedig";
import jmespath from "jmespath";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import WebSocket from "ws";

// Repositories
import { ISettingsRepository } from "@/domain/app-settings/app-settings-repository.interface.js";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import { IGeoChecksRepository } from "@/domain/geo-checks/geo-check.repository.interface.js";
import { IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import { IInvitesRepository } from "@/domain/invites/invite.repository.interface.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { IMonitorStatsRepository } from "@/domain/monitor-stats/monitor-stats.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { INotificationsRepository } from "@/domain/notifications/notification.repository.interface.js";
import { IRecoveryTokensRepository } from "@/domain/recovery-tokens/recovery-token.repository.interface.js";
import { IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import { ITagsRepository } from "@/domain/tags/tag.repository.interface.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import { ILogger } from "@/utils/logger.js";
import { NotificationReactor } from "@/worker/reactors/reactor.notification.js";
import { ReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { IncidentReactor } from "@/worker/reactors/reactor.incident.js";
import { GeoChecksPipeline } from "@/worker/worker.check-pipeline.js";
import { CheckProducer } from "@/worker/worker.check-producer.js";
import { CheckEvaluator } from "@/worker/worker.check-evaluator.js";
import { DBQueueWorker } from "@/worker/worker.db-queue.js";

export type InitializedServices = {
	settingsService: ISettingsService;
	db: IDb<Mongoose>;
	networkService: INetworkService;
	emailService: IEmailService;
	bufferService: IBufferService;
	statusService: IStatusService;
	worker: IQueueWorker;
	userService: IUserService;
	checkService: ICheckService;
	geoChecksService: IGeoChecksService;
	diagnosticService: IDiagnosticService;
	inviteService: IInviteService;
	maintenanceWindowService: IMaintenanceWindowService;
	monitorService: IMonitorService;
	incidentService: IIncidentService;
	logger: ILogger;
	notificationsService: INotificationsService;
	tagsService: ITagsService;
	statusPageService: IStatusPageService;
	notificationMessageBuilder: INotificationMessageBuilder;

	// Repositories
	monitorsRepository: IMonitorsRepository;
	checksRepository: IChecksRepository;
	geoChecksRepository: IGeoChecksRepository;
	monitorStatsRepository: IMonitorStatsRepository;
	statusPagesRepository: IStatusPagesRepository;
	usersRepository: IUsersRepository;
	invitesRepository: IInvitesRepository;
	recoveryTokensRepository: IRecoveryTokensRepository;
	settingsRepository: ISettingsRepository;
	notificationsRepository: INotificationsRepository;
	tagsRepository: ITagsRepository;
	incidentsRepository: IIncidentsRepository;
	teamsRepository: ITeamsRepository;
	maintenanceWindowsRepository: IMaintenanceWindowsRepository;
};

export const initializeServices = async ({
	logger,
	envSettings,
	settingsService,
}: {
	logger: ILogger;
	envSettings: EnvConfig;
	settingsService: ISettingsService;
}): Promise<InitializedServices> => {
	const shared = await buildShared({ logger, envSettings, settingsService });
	const {
		db,
		emailService,
		notificationMessageBuilder,
		incidentService,
		checkService,
		geoChecksService,
		notificationsService,
		workerId,
		jobsRepository,
		monitorsRepository,
		queueWorkersRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		notificationsRepository,
		tagsRepository,
		incidentsRepository,
		teamsRepository,
		maintenanceWindowsRepository,
	} = shared;

	// Network providers
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

	const tagsService = new TagsService(tagsRepository, monitorsRepository);

	const monitorStatusPolicy = new MonitorStatusPolicy();
	// reactors and dispatcher
	const notificationReactor = new NotificationReactor(notificationsService);
	const incidentReactor = new IncidentReactor(incidentService);
	const reactorDispatcher = new ReactorDispatcher(logger, [notificationReactor, incidentReactor]);

	// Check producer/evaluator
	const checkProducer = new CheckProducer(monitorsRepository, maintenanceWindowsRepository, checkService, networkService, bufferService, logger);
	const checkEvaluator = new CheckEvaluator(statusService, monitorStatusPolicy);

	// pipelines
	const geoCheckPipeline = new GeoChecksPipeline(maintenanceWindowsRepository, geoChecksService, bufferService, logger);

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

	const worker = await DBQueueWorker.create(
		logger,
		jobsRepository,
		monitorsRepository,
		checksRepository,
		checkService,
		checkProducer,
		checkEvaluator,
		geoCheckPipeline,
		reactorDispatcher,
		workerHelper,
		queueWorkersRepository,
		envSettings.queueMode,
		envSettings.queuePrimaryProcesses,
		workerId
	);

	// Business services
	const userService = new UserService({
		crypto,
		emailService,
		settingsService,
		logger,
		jwt,
		scheduler: worker,
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		teamsRepository,
	});

	const diagnosticService = new DiagnosticService(db);
	const inviteService = new InviteService({
		invitesRepository,
		settingsService,
		emailService,
	});
	const maintenanceWindowService = new MaintenanceWindowService({
		monitorsRepository,
		maintenanceWindowsRepository,
		jobsRepository,
		scheduler: worker,
	});
	const monitorService = new MonitorService({
		scheduler: worker,
		logger,
		games,
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		incidentsRepository,
	});

	const statusPageService = new StatusPageService(statusPagesRepository, settingsService);

	const services = {
		settingsService,
		db,
		networkService,
		emailService,
		bufferService,
		statusService,
		worker,
		userService,
		checkService,
		geoChecksService,
		diagnosticService,
		inviteService,
		maintenanceWindowService,
		monitorService,
		incidentService,
		logger,
		notificationsService,
		tagsService,
		statusPageService,
		notificationMessageBuilder,

		// Repositories
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		notificationsRepository,
		tagsRepository,
		incidentsRepository,
		teamsRepository,
		maintenanceWindowsRepository,
	};

	return services;
};
