import { DiagnosticService, IDiagnosticService } from "@/domain/diagnostics/diagnostic.service.js";
import { IInviteService, InviteService } from "@/domain/invites/invite.service.js";
import { IMaintenanceWindowService, MaintenanceWindowService } from "@/domain/maintenance-windows/maintenance-window.service.js";
import { IMonitorService, MonitorService } from "@/domain/monitors/monitor.service.js";
import { IStatusPageService, StatusPageService } from "@/domain/status-pages/status-page.service.js";
import { ITagsService, TagsService } from "@/domain/tags/tag.service.js";
import { IUserService, UserService } from "@/domain/users/user.service.js";
import { IJobScheduler } from "@/worker/worker.interface.js";

// Third-party
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { games } from "gamedig";

import { SharedServices } from "@/config/services.shared.js";

export interface ApiServices extends SharedServices {
	worker: IJobScheduler; // control-plane handle only (DBQueueWorker in all-in-one, bare JobScheduler in API-only)
	userService: IUserService;
	monitorService: IMonitorService;
	maintenanceWindowService: IMaintenanceWindowService;
	inviteService: IInviteService;
	statusPageService: IStatusPageService;
	tagsService: ITagsService;
	diagnosticService: IDiagnosticService;
}

export const buildApi = (shared: SharedServices, jobScheduler: IJobScheduler): ApiServices => {
	const {
		logger,
		db,
		settingsService,
		emailService,
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
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

	// ***********************
	//  Business services
	// ***********************

	const monitorService = new MonitorService({
		scheduler: jobScheduler,
		logger,
		games,
		monitorsRepository,
		checksRepository,
		geoChecksRepository,
		monitorStatsRepository,
		statusPagesRepository,
		incidentsRepository,
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

	const statusPageService = new StatusPageService(statusPagesRepository, settingsService, monitorsRepository);
	const tagsService = new TagsService(tagsRepository, monitorsRepository);
	const diagnosticService = new DiagnosticService(db);

	return {
		...shared,
		worker: jobScheduler,
		userService,
		monitorService,
		maintenanceWindowService,
		inviteService,
		statusPageService,
		tagsService,
		diagnosticService,
	};
};
