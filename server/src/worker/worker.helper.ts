const SERVICE_NAME = "JobQueueHelper";
import type { Monitor } from "@/domain/monitors/monitor.types.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { CHECK_TTL_SENTINEL } from "@/domain/checks/check.type.js";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import { IGeoChecksRepository } from "@/domain/geo-checks/geo-check.repository.interface.js";
import { IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import { IMonitorStatsRepository } from "@/domain/monitor-stats/monitor-stats.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { ILogger } from "@/utils/logger.js";
import { IReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { ICheckPipeline } from "@/worker/worker.check-pipeline.js";

export interface IWorkerHelper {
	readonly serviceName: string;
	getHeartbeatJob(): (monitor: Monitor) => Promise<void>;
	getHeartbeatGeoJob(): (monitor: Monitor) => Promise<void>;
	getCleanupOrphanedJob(): () => Promise<void>;
	getCleanupRetentionJob(): () => Promise<void>;
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

export class WorkerHelper implements IWorkerHelper {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private checkService: ICheckService;
	private settingsService: ISettingsService;
	private monitorsRepository: IMonitorsRepository;
	private teamsRepository: ITeamsRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private checksRepository: IChecksRepository;
	private incidentsRepository: IIncidentsRepository;
	private geoChecksRepository: IGeoChecksRepository;
	private reactorDispatcher: IReactorDispatcher;
	private checkPipeline: ICheckPipeline;
	private geoCheckPipeline: ICheckPipeline;

	constructor(
		logger: ILogger,
		checkService: ICheckService,
		settingsService: ISettingsService,
		monitorsRepository: IMonitorsRepository,
		teamsRepository: ITeamsRepository,
		monitorStatsRepository: IMonitorStatsRepository,
		checksRepository: IChecksRepository,
		incidentsRepository: IIncidentsRepository,
		geoChecksRepository: IGeoChecksRepository,
		reactorDispatcher: IReactorDispatcher,
		checkPipeline: ICheckPipeline,
		geoCheckPipeline: ICheckPipeline
	) {
		this.logger = logger;
		this.checkService = checkService;
		this.settingsService = settingsService;
		this.monitorsRepository = monitorsRepository;
		this.teamsRepository = teamsRepository;
		this.monitorStatsRepository = monitorStatsRepository;
		this.checksRepository = checksRepository;
		this.incidentsRepository = incidentsRepository;
		this.geoChecksRepository = geoChecksRepository;
		this.reactorDispatcher = reactorDispatcher;
		this.checkPipeline = checkPipeline;
		this.geoCheckPipeline = geoCheckPipeline;
	}

	get serviceName() {
		return WorkerHelper.SERVICE_NAME;
	}

	getHeartbeatJob = () => {
		return async (monitor: Monitor) => {
			try {
				const evaluation = await this.checkPipeline.run(monitor);
				if (evaluation) await this.reactorDispatcher.dispatch(evaluation);
			} catch (error: unknown) {
				this.logger.warn({
					message: error instanceof Error ? error.message : "Unknown error",
					service: SERVICE_NAME,
					method: "getMonitorJob",
					stack: error instanceof Error ? error.stack : undefined,
				});
				throw error;
			}
		};
	};

	getHeartbeatGeoJob = () => {
		return async (monitor: Monitor) => {
			try {
				await this.geoCheckPipeline.run(monitor);
			} catch (error: unknown) {
				this.logger.error({
					message: error instanceof Error ? error.message : "Unknown error",
					service: SERVICE_NAME,
					method: "getHeartbeatGeoJob",
					stack: error instanceof Error ? error.stack : undefined,
				});
				// Don't throw - geo check failures shouldn't crash the job scheduler
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

				// Remove orphaned geo checks
				const deletedGeoChecksCount = await this.geoChecksRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedGeoChecksCount > 0) {
					this.logger.info({
						message: `Deleted ${deletedGeoChecksCount} orphaned geo checks`,
						service: SERVICE_NAME,
						method: "getCleanupOrphanedJob",
					});
				}

				this.logger.info({
					message: "Cleanup of orphaned data completed",
					service: SERVICE_NAME,
					method: "getCleanupOrphanedJob",
				});
			} catch (error: unknown) {
				this.logger.warn({
					message: error instanceof Error ? error.message : "Unknown error",
					service: SERVICE_NAME,
					method: "getCleanupOrphanedJob",
					stack: error instanceof Error ? error.stack : undefined,
				});
				throw error;
			}
		};
	};

	getCleanupRetentionJob = () => {
		return async () => {
			try {
				const settings = await this.settingsService.getDBSettings();

				const checkTTL = settings.checkTTL; // Check TTL is in DAYS, not MS

				if (checkTTL === CHECK_TTL_SENTINEL) {
					this.logger.info({
						message: `Check TTL is set to unlimited, skipping cleanup`,
						service: SERVICE_NAME,
						method: "getCleanupRetentionJob",
					});
					return;
				}
				const checkTTLInMs = checkTTL * 24 * 60 * 60 * 1000;
				const cutoffDate = new Date(Date.now() - checkTTLInMs);
				const deleteCount = await this.checkService.deleteOlderThan(cutoffDate);
				this.logger.info({
					message: `Deleted ${deleteCount} checks older than ${cutoffDate.toISOString()}`,
					service: SERVICE_NAME,
					method: "getCleanupRetentionJob",
				});
			} catch (error: unknown) {
				this.logger.error({
					message: error instanceof Error ? error.message : "Unknown error",
					service: SERVICE_NAME,
					method: "getCleanupRetentionJob",
					stack: error instanceof Error ? error.stack : undefined,
				});
			}
		};
	};
}
