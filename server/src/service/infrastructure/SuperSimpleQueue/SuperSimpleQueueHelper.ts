const SERVICE_NAME = "JobQueueHelper";
import type { Monitor } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { INetworkService, INotificationsService, IStatusService } from "@/service/index.js";
import type { StatusChangeResult, MonitorStatusResponse, HardwareStatusPayload, MonitorStatus } from "@/types/index.js";
import IncidentService from "@/service/business/incidentService.js";
import { IMaintenanceWindowsRepository, IMonitorsRepository } from "@/repositories/index.js";

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

class SuperSimpleQueueHelper {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	private networkService: INetworkService;
	private statusService: IStatusService;
	private notificationsService: INotificationsService;
	private checkService: any;
	private buffer: any;
	private incidentService: IncidentService;
	private maintenanceWindowsRepository: IMaintenanceWindowsRepository;
	private monitorsRepository: IMonitorsRepository;

	constructor({
		logger,
		networkService,
		statusService,
		notificationsService,
		checkService,
		buffer,
		incidentService,
		maintenanceWindowsRepository,
		monitorsRepository,
	}: {
		logger: any;
		networkService: INetworkService;
		statusService: IStatusService;
		notificationsService: INotificationsService;
		checkService: any;
		buffer: any;
		incidentService: IncidentService;
		maintenanceWindowsRepository: IMaintenanceWindowsRepository;
		monitorsRepository: IMonitorsRepository;
	}) {
		this.logger = logger;
		this.networkService = networkService;
		this.statusService = statusService;
		this.checkService = checkService;
		this.buffer = buffer;
		this.notificationsService = notificationsService;
		this.incidentService = incidentService;
		this.maintenanceWindowsRepository = maintenanceWindowsRepository;
		this.monitorsRepository = monitorsRepository;
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
				this.buffer.addToBuffer({ check });
				// Step 4.  Update monitor status
				const statusChangeResult = await this.statusService.updateMonitorStatus(status, check);

				// Step 5.  Get decisions
				const decision = this.evaluateMonitorAction(statusChangeResult);

				// Step 6. Handle notifications (best effort, continue even in event of failure, don't wait)
				if (decision.shouldSendNotification) {
					this.notificationsService
						.handleNotifications(statusChangeResult.monitor, status, statusChangeResult.prevStatus, statusChangeResult.statusChanged)
						.catch((error: any) => {
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
				this.incidentService.handleIncident(statusChangeResult.monitor, statusChangeResult.code, decision).catch((error: any) => {
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

		// Simplified logic: Just check status changes
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
