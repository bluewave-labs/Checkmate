import { DiagnosticService, IDiagnosticService } from "@/domain/diagnostics/diagnostic.service.js";
import { IInviteService, InviteService } from "@/domain/invites/invite.service.js";
import { IMaintenanceWindowService, MaintenanceWindowService } from "@/domain/maintenance-windows/maintenance-window.service.js";
import { IMonitorService, MonitorService } from "@/domain/monitors/monitor.service.js";
import { IStatusPageService, StatusPageService } from "@/domain/status-pages/status-page.service.js";
import { ITagsService, TagsService } from "@/domain/tags/tag.service.js";
import { IUserService, UserService } from "@/domain/users/user.service.js";
import { IJobScheduler } from "@/worker/worker.interface.js";
import { ProxiesService, IProxiesService } from "@/domain/proxies/proxy.service.js";
import { EgressStateService, IEgressStateService } from "@/domain/egress/egress-state.service.js";
import { HeartbeatService, IHeartbeatService } from "@/domain/heartbeat/heartbeat.service.js";
import { TeamService, ITeamService } from "@/domain/teams/team.service.js";
import { AppVersionService, IAppVersionService } from "@/domain/app-version/app-version.service.js";
import { ConnectService, IConnectService } from "@/domain/connect/connect.service.js";
import { ConnectTunnel } from "@/domain/connect/connect-tunnel.js";
import { ConnectApiService } from "@/domain/connect/connect-api.service.js";
import { AuthStateService, IAuthStateService } from "@/domain/users/auth-state.service.js";
import { SsoSessionService, ISsoSessionService } from "@/domain/sso/sso-session.service.js";
import { SharedServices } from "@/config/services.shared.js";

// Third-party
import jwt from "jsonwebtoken";
import got from "got";
import crypto from "crypto";
import { games } from "gamedig";
import WebSocket from "ws";

export interface ApiServices extends SharedServices {
	worker: IJobScheduler; // control-plane handle only (DBQueueWorker in all-in-one, bare JobScheduler in API-only)
	userService: IUserService;
	authStateService: IAuthStateService;
	ssoSessionService: ISsoSessionService;
	monitorService: IMonitorService;
	maintenanceWindowService: IMaintenanceWindowService;
	inviteService: IInviteService;
	statusPageService: IStatusPageService;
	tagsService: ITagsService;
	diagnosticService: IDiagnosticService;
	proxiesService: IProxiesService;
	egressStateService: IEgressStateService;
	heartbeatService: IHeartbeatService;
	teamService: ITeamService;
	appVersionService: IAppVersionService;
	connectService: IConnectService;
}

export const buildApi = (shared: SharedServices, jobScheduler: IJobScheduler): ApiServices => {
	const {
		logger,
		settingsService,
		checkService,
		emailService,
		monitorsRepository,
		checksRepository,
		checkRollupsRepository,
		geoChecksRepository,
		dockerLogsRepository,
		monitorStatsRepository,
		statusPagesRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		tagsRepository,
		incidentsRepository,
		teamsRepository,
		maintenanceWindowsRepository,
		jobsRepository,
		proxiesRepository,
		queueWorkersRepository,
		connectRepository,
		ssoSessionsRepository,
		diagnosticsRepository,
		encryptionService,
	} = shared;

	const userService = new UserService({
		crypto,
		emailService,
		settingsService,
		logger,
		jwt,
		scheduler: jobScheduler,
		monitorsRepository,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		teamsRepository,
	});

	const authStateService = new AuthStateService(usersRepository);
	const ssoSessionService = new SsoSessionService(ssoSessionsRepository, usersRepository, settingsService);

	// ***********************
	//  Business services
	// ***********************

	const monitorService = new MonitorService({
		scheduler: jobScheduler,
		logger,
		games,
		monitorsRepository,
		checksRepository,
		checkRollupsRepository,
		geoChecksRepository,
		dockerLogsRepository,
		monitorStatsRepository,
		statusPagesRepository,
		incidentsRepository,
		encryptionService: shared.encryptionService,
	});

	const maintenanceWindowService = new MaintenanceWindowService({
		monitorsRepository,
		maintenanceWindowsRepository,
		jobsRepository,
		scheduler: jobScheduler,
	});

	const inviteService = new InviteService({
		invitesRepository,
		settingsService,
		emailService,
	});

	const statusPageService = new StatusPageService(
		statusPagesRepository,
		settingsService,
		monitorsRepository,
		checkRollupsRepository,
		incidentsRepository
	);
	const tagsService = new TagsService(tagsRepository, monitorsRepository);
	const diagnosticService = new DiagnosticService(diagnosticsRepository, logger);
	const proxiesService = new ProxiesService(proxiesRepository, monitorsRepository, settingsService);
	const egressStateService = new EgressStateService(queueWorkersRepository, settingsService);
	const heartbeatService = new HeartbeatService({
		logger,
		teamsRepository,
		encryptionService,
		monitorsRepository,
		maintenanceWindowsRepository,
		jobsRepository,
		checkService,
		scheduler: jobScheduler,
		usersRepository,
		monitorService,
	});
	const teamService = new TeamService({ logger, teamsRepository, encryptionService });
	const appVersionService = new AppVersionService(got, logger);
	const connectTunnel = new ConnectTunnel(WebSocket, got, settingsService, logger);
	const connectApiService = new ConnectApiService(got, settingsService, logger);
	const connectService = new ConnectService(
		connectRepository,
		encryptionService,
		settingsService,
		connectTunnel,
		connectApiService,
		queueWorkersRepository,
		jobScheduler,
		logger
	);
	return {
		...shared,
		worker: jobScheduler,
		userService,
		authStateService,
		ssoSessionService,
		monitorService,
		maintenanceWindowService,
		inviteService,
		statusPageService,
		tagsService,
		diagnosticService,
		proxiesService,
		egressStateService,
		heartbeatService,
		teamService,
		appVersionService,
		connectService,
	};
};
