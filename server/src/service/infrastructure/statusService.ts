import { IChecksRepository, IMonitorsRepository, IMonitorStatsRepository } from "@/repositories/index.js";
import type {
	Monitor,
	MonitorStatus,
	MonitorStatusResponse,
	StatusChangeResult,
	Check,
	HardwareStatusPayload,
	PageSpeedStatusPayload,
	CheckSnapshot,
	MonitorStats,
} from "@/types/index.js";
import { ILogger } from "@/utils/logger.js";
const SERVICE_NAME = "StatusService";

export interface IStatusService {
	updateRunningStats({ monitor, networkResponse }: { monitor: Monitor; networkResponse: any }): Promise<boolean>;
	handleIncidentForCheck(check: any, monitor: Monitor, action: any, errorContext?: string): Promise<void>;
	updateMonitorStatus(
		statusResponse: MonitorStatusResponse<PageSpeedStatusPayload | HardwareStatusPayload | undefined>,
		check: Check
	): Promise<StatusChangeResult>;
}

export class StatusService implements IStatusService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: any;
	private buffer: any;
	private monitorsRepository: IMonitorsRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private checksRepository: IChecksRepository;

	constructor(
		logger: ILogger,
		buffer: any,
		monitorsRepository: IMonitorsRepository,
		monitorStatsRepository: IMonitorStatsRepository,
		checksRepository: IChecksRepository
	) {
		this.logger = logger;
		this.buffer = buffer;
		this.monitorsRepository = monitorsRepository;
		this.monitorStatsRepository = monitorStatsRepository;
		this.checksRepository = checksRepository;
	}

	get serviceName() {
		return StatusService.SERVICE_NAME;
	}

	async updateRunningStats({ monitor, networkResponse }: { monitor: Monitor; networkResponse: MonitorStatusResponse }) {
		try {
			const monitorId = monitor.id;
			const { responseTime, status } = networkResponse;
			let stats: Omit<MonitorStats, "id" | "createdAt" | "updatedAt"> | null = null;
			stats = await this.monitorStatsRepository
				.findByMonitorId(monitorId)
				.then((result) => result)
				.catch(() => {
					this.logger.debug({
						service: SERVICE_NAME,
						method: "updateRunningStats",
						message: `No existing stats found for monitor ${monitorId}, initializing new stats.`,
					});
					return null;
				});
			if (!stats) {
				stats = {
					monitorId,
					avgResponseTime: 0,
					maxResponseTime: 0,
					totalChecks: 0,
					totalUpChecks: 0,
					totalDownChecks: 0,
					uptimePercentage: 0,
					lastResponseTime: 0,
					lastCheckTimestamp: 0,
				};
			}

			// Update stats

			// Last response time
			stats.lastResponseTime = responseTime ?? 0;

			// Max response time
			if (responseTime && responseTime > stats.maxResponseTime) {
				stats.maxResponseTime = responseTime;
			}

			// Avg response time:
			let avgResponseTime = stats.avgResponseTime;
			if (typeof responseTime !== "undefined" && responseTime !== null) {
				if (avgResponseTime === 0) {
					avgResponseTime = responseTime;
				} else {
					avgResponseTime = (avgResponseTime * (stats.totalChecks - 1) + responseTime) / stats.totalChecks;
				}
			}
			stats.avgResponseTime = avgResponseTime;

			// Total checks
			stats.totalChecks++;
			if (status === true) {
				stats.totalUpChecks++;
				// Update the timeSinceLastFailure if needed
				if (stats.timeOfLastFailure === 0) {
					stats.timeOfLastFailure = new Date().getTime();
				}
			} else {
				stats.totalDownChecks++;
				stats.timeOfLastFailure = 0;
			}

			// Calculate uptime percentage
			let uptimePercentage;
			if (stats.totalChecks > 0) {
				uptimePercentage = stats.totalUpChecks / stats.totalChecks;
			} else {
				uptimePercentage = status === true ? 100 : 0;
			}
			stats.uptimePercentage = uptimePercentage;

			// latest check
			stats.lastCheckTimestamp = new Date().getTime();
			await this.monitorStatsRepository.create(stats);
			return true;
		} catch (error: any) {
			this.logger.error({
				service: SERVICE_NAME,
				message: error.message,
				method: "updateRunningStats",
				stack: error.stack,
			});
			return false;
		}
	}

	handleIncidentForCheck = async (check: Check, monitor: Monitor, action: any, errorContext = "incident handling") => {
		try {
			let savedCheck: Check | null = null;
			if (!check.id) {
				try {
					savedCheck = await this.checksRepository.create(check);

					this.buffer.removeCheckFromBuffer(check);
				} catch (checkError: any) {
					this.logger.error({
						service: SERVICE_NAME,
						method: "handleIncidentForCheck",
						message: `Failed to save check immediately for ${errorContext}: ${checkError.message}`,
						monitorId: monitor.id,
						stack: checkError.stack,
					});
					savedCheck = null;
				}
			}

			if (savedCheck && savedCheck.id) {
				try {
					this.buffer.addIncidentToBuffer({ monitor, check: savedCheck, action });
				} catch (incidentError: any) {
					this.logger.error({
						service: SERVICE_NAME,
						method: "handleIncidentForCheck",
						message: `Failed to add incident to buffer for ${errorContext}: ${incidentError.message}`,
						monitorId: monitor.id,
						action,
						stack: incidentError.stack,
					});
				}
			}
		} catch (error: any) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "handleIncidentForCheck",
				message: `Error in ${errorContext}: ${error.message}`,
				monitorId: monitor?.id,
				stack: error.stack,
			});
		}
	};

	updateMonitorStatus = async (
		statusResponse: MonitorStatusResponse<PageSpeedStatusPayload | HardwareStatusPayload | undefined>,
		check: Check
	): Promise<StatusChangeResult> => {
		try {
			const { monitorId, teamId, status, code } = statusResponse;
			const monitor = await this.monitorsRepository.findById(monitorId, teamId);

			// Update running stats
			this.updateRunningStats({ monitor, networkResponse: statusResponse });

			monitor.statusWindow = monitor.statusWindow || [];
			monitor.statusWindow.push(status);
			while (monitor.statusWindow.length > monitor.statusWindowSize) {
				monitor.statusWindow.shift();
			}

			const checkSnapshot: CheckSnapshot = {
				id: check.id,
				status: check.status,
				responseTime: check.responseTime,
				timings: check.timings,
				statusCode: check.statusCode,
				message: check.message,
				cpu: check.cpu,
				memory: check.memory,
				disk: check.disk,
				host: check.host,
				errors: check.errors,
				capture: check.capture,
				net: check.net,
				accessibility: check.accessibility,
				bestPractices: check.bestPractices,
				seo: check.seo,
				performance: check.performance,
				audits: check.audits,
				createdAt: check.createdAt,
			};
			monitor.recentChecks = monitor.recentChecks || [];
			monitor.recentChecks.push(checkSnapshot);
			const maxRecentChecks = 25;
			while (monitor.recentChecks.length > maxRecentChecks) {
				monitor.recentChecks.shift();
			}

			const prevStatus = monitor.status;
			let newStatus: MonitorStatus = status === true ? "up" : "down";
			let statusChanged = false;

			// Return early if not enough data points
			if (monitor.statusWindow.length < monitor.statusWindowSize) {
				monitor.status = newStatus;
				const updated = await this.monitorsRepository.updateById(monitor.id, monitor.teamId, monitor);
				return {
					monitor: updated,
					statusChanged: false,
					prevStatus,
					code,
					timestamp: Date.now(),
				};
			}

			// Check if threshold has been met
			const failures = monitor.statusWindow.filter((s) => s === false).length;
			const failureRate = (failures / monitor.statusWindow.length) * 100;

			// If threshold has been met and the monitor is not already down, mark down:
			if (failureRate >= monitor.statusWindowThreshold && monitor.status !== "down") {
				newStatus = "down";
				statusChanged = true;
			}
			// If the failure rate is below the threshold and the monitor is down, recover:
			else if (failureRate < monitor.statusWindowThreshold && monitor.status === "down") {
				newStatus = "up";
				statusChanged = true;
			}

			// Evaluate hardware threshold breaches (only for hardware monitors)
			let thresholdBreaches: { cpu: boolean; memory: boolean; disk: boolean; temp: boolean } | undefined;
			if (monitor.type === "hardware" && statusResponse.payload) {
				const payload = statusResponse.payload as HardwareStatusPayload;
				const metrics = payload?.data;

				if (metrics) {
					// Evaluate threshold breaches
					const cpuUsage = metrics.cpu?.usage_percent ?? -1;
					const cpuBreach = cpuUsage !== -1 && cpuUsage > monitor.cpuAlertThreshold / 100;

					const memoryUsage = metrics.memory?.usage_percent ?? -1;
					const memoryBreach = memoryUsage !== -1 && memoryUsage > monitor.memoryAlertThreshold / 100;

					const diskBreach =
						metrics.disk?.some((d: any) => typeof d?.usage_percent === "number" && d.usage_percent > monitor.diskAlertThreshold / 100) ?? false;

					const temps = metrics.cpu?.temperature ?? [];
					const tempBreach = temps.some((temp: number) => temp > monitor.tempAlertThreshold);

					thresholdBreaches = {
						cpu: cpuBreach,
						memory: memoryBreach,
						disk: diskBreach,
						temp: tempBreach,
					};

					// Update counters: decrement if breached, reset to 5 if not breached
					if (cpuBreach) {
						monitor.cpuAlertCounter = Math.max(0, monitor.cpuAlertCounter - 1);
					} else {
						monitor.cpuAlertCounter = 5;
					}

					if (memoryBreach) {
						monitor.memoryAlertCounter = Math.max(0, monitor.memoryAlertCounter - 1);
					} else {
						monitor.memoryAlertCounter = 5;
					}

					if (diskBreach) {
						monitor.diskAlertCounter = Math.max(0, monitor.diskAlertCounter - 1);
					} else {
						monitor.diskAlertCounter = 5;
					}

					if (tempBreach) {
						monitor.tempAlertCounter = Math.max(0, monitor.tempAlertCounter - 1);
					} else {
						monitor.tempAlertCounter = 5;
					}

					// Check if any counter has reached zero (initial breach)
					const anyCounterZero =
						monitor.cpuAlertCounter === 0 || monitor.memoryAlertCounter === 0 || monitor.diskAlertCounter === 0 || monitor.tempAlertCounter === 0;

					const anyThresholdBreached = cpuBreach || memoryBreach || diskBreach || tempBreach;
					const allThresholdsNormal = !cpuBreach && !memoryBreach && !diskBreach && !tempBreach;

					// Update monitor status based on threshold breach state
					if (newStatus !== "down") {
						// Don't override "down" status - service unreachable takes precedence
						// Check current monitor status, not newStatus for comparison
						if (anyCounterZero && anyThresholdBreached && monitor.status !== "breached") {
							// Initial breach: counter hit zero, change status to breached
							newStatus = "breached";
							statusChanged = true;
						} else if (anyCounterZero && anyThresholdBreached && monitor.status === "breached") {
							// Already breached, keep status but don't mark as changed
							newStatus = "breached";
							// statusChanged remains false
						} else if (allThresholdsNormal && monitor.status === "breached") {
							// All thresholds returned to normal, recover from breached state
							newStatus = "up";
							statusChanged = true;
						}
					}
				}
			}

			// Apply the final status
			monitor.status = newStatus;

			const updated = await this.monitorsRepository.updateById(monitor.id, monitor.teamId, monitor);

			return {
				monitor: updated,
				statusChanged,
				prevStatus,
				code,
				timestamp: new Date().getTime(),
				thresholdBreaches,
			};
		} catch (error: any) {
			error.service = SERVICE_NAME;
			error.method = "updateStatus";
			throw error;
		}
	};

	insertCheck = async (check: Check) => {
		try {
			if (typeof check === "undefined") {
				this.logger.warn({
					message: "Failed to build check",
					service: SERVICE_NAME,
					method: "insertCheck",
				});
				return false;
			}
			this.buffer.addToBuffer(check);
			return true;
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: error.service || SERVICE_NAME,
				method: error.method || "insertCheck",
				details: error.details || `Error inserting check for monitor: ${check?.metadata.monitorId}`,
				stack: error.stack,
			});
		}
	};
}
