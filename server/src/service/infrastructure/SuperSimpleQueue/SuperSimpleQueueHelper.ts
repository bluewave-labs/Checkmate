const SERVICE_NAME = "JobQueueHelper";
import type { Monitor } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { INetworkService, INotificationsService, IStatusService } from "@/service/index.js";
import type { StatusChangeResult, MonitorStatusResponse, HardwareStatusPayload, MonitorStatus } from "@/types/index.js";
import IncidentService from "@/service/business/incidentService.js";
import type { IGeoChecksService } from "@/service/business/geoChecksService.js";
import {
	IMaintenanceWindowsRepository,
	IMonitorsRepository,
	ITeamsRepository,
	IMonitorStatsRepository,
	IChecksRepository,
	IIncidentsRepository,
} from "@/repositories/index.js";
import { ILogger } from "@/utils/logger.js";
import { IBufferService } from "../bufferService.js";

export interface ISuperSimpleQueueHelper {
	readonly serviceName: string;
	getMonitorJob(): (monitor: Monitor) => Promise<void>;
	getCleanupOrphanedJob(): () => Promise<void>;
	getGeoCheckJob(): (monitor: Monitor) => Promise<void>;
	isInMaintenanceWindow(monitorId: string, teamId: string): Promise<boolean>;
}

export interface MonitorActionDecision {
	shouldCreateIncident: boolean;
	shouldResolveIncident: boolean;
	shouldSendNotification: boolean;
	incidentReason: "status_down" | "threshold_breach" | null;
	notificationReason: "status_change" | "threshold_breach" | null;
	thresholdBreaches?: {
		cpu?: boolean;
		memory?: boolean;
		disk?: boolean;
		temp?: boolean;
	};
}

class SuperSimpleQueueHelper implements ISuperSimpleQueueHelper {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	private networkService: INetworkService;
	private statusService: IStatusService;
	private notificationsService: INotificationsService;
	private checkService: any;
	private buffer: IBufferService;
	private incidentService: IncidentService;
	private maintenanceWindowsRepository: IMaintenanceWindowsRepository;
	private monitorsRepository: IMonitorsRepository;
	private teamsRepository: ITeamsRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private checksRepository: IChecksRepository;
	private incidentsRepository: IIncidentsRepository;
	private geoChecksService: IGeoChecksService;

	constructor(
		logger: ILogger,
		networkService: INetworkService,
		statusService: IStatusService,
		notificationsService: INotificationsService,
		checkService: any,
		buffer: IBufferService,
		incidentService: IncidentService,
		maintenanceWindowsRepository: IMaintenanceWindowsRepository,
		monitorsRepository: IMonitorsRepository,
		teamsRepository: ITeamsRepository,
		monitorStatsRepository: IMonitorStatsRepository,
		checksRepository: IChecksRepository,
		incidentsRepository: IIncidentsRepository,
		geoChecksService: IGeoChecksService
	) {
		this.logger = logger;
		this.networkService = networkService;
		this.statusService = statusService;
		this.checkService = checkService;
		this.buffer = buffer;
		this.notificationsService = notificationsService;
		this.incidentService = incidentService;
		this.maintenanceWindowsRepository = maintenanceWindowsRepository;
		this.monitorsRepository = monitorsRepository;
		this.teamsRepository = teamsRepository;
		this.monitorStatsRepository = monitorStatsRepository;
		this.checksRepository = checksRepository;
		this.incidentsRepository = incidentsRepository;
		this.geoChecksService = geoChecksService;
	}

	get serviceName() {
		return SuperSimpleQueueHelper.SERVICE_NAME;
	}

	getMonitorJob = () => {
		return async (monitor: Monitor) => {
			try {
				const monitorId = monitor.id;
				const teamId = monitor.teamId;
				if (!monitorId) {
					throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "getMonitorJob" });
				}

				// Step 1.  Check for maintenance window, if found, skip the check

				const maintenanceWindowActive = await this.isInMaintenanceWindow(monitorId, teamId);
				if (maintenanceWindowActive) {
					this.logger.debug({
						message: `Monitor ${monitorId} is in maintenance window`,
						service: SERVICE_NAME,
						method: "getMonitorJob",
					});
					if (monitor.status !== "maintenance") {
						await this.monitorsRepository.updateById(monitorId, teamId, { status: "maintenance" });
					}
					return;
				}

				// Step 2.  Request monitor status
				const status = await this.networkService.requestStatus(monitor);
				if (!status) {
					throw new Error("No network response");
				}

				// Step 3.  Build check
				const check = await this.checkService.buildCheck(status);
				if (!check) {
					this.logger.warn({
						message: `No check could be built for monitor ${monitorId}`,
						service: SERVICE_NAME,
						method: "getMonitorJob",
						details: { code: status.code, message: status.message },
					});
					return;
				}
				// Step 4 Add check to buffer
				this.buffer.addToBuffer(check);
				// Step 4.  Update monitor status
				const statusChangeResult = await this.statusService.updateMonitorStatus(status, check);

				// Step 5.  Get decisions
				const decision = this.evaluateMonitorAction(statusChangeResult);

				// Step 6. Handle notifications (best effort, continue even in event of failure, don't wait)
				if (decision.shouldSendNotification) {
					this.notificationsService.handleNotifications(statusChangeResult.monitor, status, decision).catch((error: any) => {
						this.logger.error({
							message: error.message,
							service: SERVICE_NAME,
							method: "getMonitorJob",
							details: `Error sending notifications for job ${statusChangeResult.monitor.id}: ${error.message}`,
							stack: error.stack,
						});
					});
				}

				// Step 7. Handle incidents (best effort, don't wait)
				this.incidentService.handleIncident(statusChangeResult.monitor, statusChangeResult.code, decision, status).catch((error: any) => {
					this.logger.warn({
						message: error.message,
						service: SERVICE_NAME,
						method: "getMonitorJob",
						details: `Error handling incident for job ${monitor.id}: ${error.message}`,
						stack: error.stack,
					});
				});
			} catch (error: any) {
				this.logger.warn({
					message: error.message,
					service: error.service || SERVICE_NAME,
					method: error.method || "getMonitorJob",
					stack: error.stack,
				});
				throw error;
			}
		};
	};

	getCleanupOrphanedJob = () => {
		return async () => {
			try {
				this.logger.info({
					message: "Starting cleanup of orphaned data",
					service: SERVICE_NAME,
					method: "getCleanupOrphanedJob",
				});

				// Get all valid team IDs
				const validTeamIds = await this.teamsRepository.findAllTeamIds();
				this.logger.debug({
					message: `Found ${validTeamIds.length} valid teams`,
					service: SERVICE_NAME,
					method: "getCleanupOrphanedJob",
				});

				// Remove orphaned monitors (monitors without a valid team)
				const deletedMonitorCount = await this.monitorsRepository.deleteByTeamIdsNotIn(validTeamIds);
				if (deletedMonitorCount > 0) {
					this.logger.info({
						message: `Deleted ${deletedMonitorCount} orphaned monitors`,
						service: SERVICE_NAME,
						method: "getCleanupOrphanedJob",
					});
				}

				// Remove orphaned monitorStats (stats without a valid monitor)
				const allMonitorIds = await this.monitorsRepository.findAllMonitorIds();
				this.logger.debug({
					message: `Found ${allMonitorIds.length} valid monitors`,
					service: SERVICE_NAME,
					method: "getCleanupOrphanedJob",
				});

				const deletedStatsCount = await this.monitorStatsRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedStatsCount > 0) {
					this.logger.info({
						message: `Deleted ${deletedStatsCount} orphaned monitor stats`,
						service: SERVICE_NAME,
						method: "getCleanupOrphanedJob",
					});
				}

				// Remove orphaned checks
				const deletedChecksCount = await this.checksRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedChecksCount > 0) {
					this.logger.info({
						message: `Deleted ${deletedChecksCount} orphaned checks`,
						service: SERVICE_NAME,
						method: "getCleanupOrphanedJob",
					});
				}

				// Remove orphaned incidents
				const deletedIncidentsCount = await this.incidentsRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedIncidentsCount > 0) {
					this.logger.info({
						message: `Deleted ${deletedIncidentsCount} orphaned incidents`,
						service: SERVICE_NAME,
						method: "getCleanupOrphanedJob",
					});
				}

				this.logger.info({
					message: "Cleanup of orphaned data completed",
					service: SERVICE_NAME,
					method: "getCleanupOrphanedJob",
				});
			} catch (error: any) {
				this.logger.warn({
					message: error.message,
					service: SERVICE_NAME,
					method: "getCleanupOrphanedJob",
					stack: error.stack,
				});
				throw error;
			}
		};
	};

	getGeoCheckJob = () => {
		return async (monitor: Monitor) => {
			try {
				const monitorId = monitor.id;
				const teamId = monitor.teamId;

				// Step 1: Validate monitor eligibility
				if (!monitorId) {
					throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "getGeoCheckJob" });
				}

				if (monitor.type !== "http") {
					this.logger.debug({
						message: `Monitor ${monitorId} is not HTTP type, skipping geo check`,
						service: SERVICE_NAME,
						method: "getGeoCheckJob",
					});
					return;
				}

				if (!monitor.geoCheckEnabled) {
					return;
				}

				if (!monitor.geoCheckLocations || monitor.geoCheckLocations.length === 0) {
					this.logger.warn({
						message: `No geo check locations configured for monitor ${monitorId}`,
						service: SERVICE_NAME,
						method: "getGeoCheckJob",
					});
					return;
				}

				// Step 2: Check for maintenance window
				const maintenanceWindowActive = await this.isInMaintenanceWindow(monitorId, teamId);
				if (maintenanceWindowActive) {
					this.logger.debug({
						message: `Monitor ${monitorId} is in maintenance window, skipping geo check`,
						service: SERVICE_NAME,
						method: "getGeoCheckJob",
					});
					return;
				}

				// Step 3: Build geo check (handles API calls and polling)
				const geoCheck = await this.geoChecksService.buildGeoCheck(monitor);
				if (!geoCheck) {
					this.logger.warn({
						message: `No geo check could be built for monitor ${monitorId}`,
						service: SERVICE_NAME,
						method: "getGeoCheckJob",
					});
					return;
				}

				// Step 4: Add geo check to buffer
				this.buffer.addGeoCheckToBuffer(geoCheck);

				this.logger.debug({
					message: `Geo check job executed for monitor ${monitorId}`,
					service: SERVICE_NAME,
					method: "getGeoCheckJob",
				});
			} catch (error: any) {
				this.logger.error({
					message: error.message,
					service: SERVICE_NAME,
					method: "getGeoCheckJob",
					stack: error.stack,
				});
				// Don't throw - geo check failures shouldn't crash the job scheduler
			}
		};
	};

	async isInMaintenanceWindow(monitorId: string, teamId: string) {
		const maintenanceWindows = await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
		// Check for active maintenance window:
		const maintenanceWindowIsActive = maintenanceWindows.reduce((acc: any, window: any) => {
			if (window.active) {
				const start = new Date(window.start);
				const end = new Date(window.end);
				const now = new Date();
				const repeatInterval = window.repeat || 0;

				// If start is < now and end > now, we're in maintenance
				if (start <= now && end >= now) return true;

				// If maintenance window was set in the past with a repeat,
				// we need to advance start and end to see if we are in range

				while (start < now && repeatInterval !== 0) {
					start.setTime(start.getTime() + repeatInterval);
					end.setTime(end.getTime() + repeatInterval);
					if (start <= now && end >= now) {
						return true;
					}
				}
				return false;
			}
			return acc;
		}, false);
		return maintenanceWindowIsActive;
	}

	private evaluateMonitorAction(statusChangeResult: StatusChangeResult): MonitorActionDecision {
		const { monitor, statusChanged, prevStatus } = statusChangeResult;

		// Initialize result
		const decision: MonitorActionDecision = {
			shouldCreateIncident: false,
			shouldResolveIncident: false,
			shouldSendNotification: false,
			incidentReason: null,
			notificationReason: null,
		};

		if (!statusChanged) {
			return decision;
		}

		if (monitor.status === "down") {
			// Monitor went down (unreachable)
			decision.shouldCreateIncident = true;
			decision.shouldSendNotification = true;
			decision.incidentReason = "status_down";
			decision.notificationReason = "status_change";
		} else if (monitor.status === "breached") {
			// Hardware monitor exceeded thresholds
			decision.shouldCreateIncident = true;
			decision.shouldSendNotification = true;
			decision.incidentReason = "threshold_breach";
			decision.notificationReason = "threshold_breach";
		} else if (monitor.status === "up" && (prevStatus === "down" || prevStatus === "breached")) {
			// Monitor recovered from down or breached state
			decision.shouldResolveIncident = true;
			decision.shouldSendNotification = true;
			decision.notificationReason = "status_change";
		}

		return decision;
	}
}

export default SuperSimpleQueueHelper;
