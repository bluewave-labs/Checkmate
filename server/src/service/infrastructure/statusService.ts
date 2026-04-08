import { IChecksRepository, IMonitorsRepository, IMonitorStatsRepository } from "@/repositories/index.js";
import type {
	Monitor,
	MonitorStatus,
	MonitorStatusResponse,
	StatusChangeResult,
	Check,
	HardwareStatusPayload,
	PageSpeedStatusPayload,
	PingStatusPayload,
	HttpStatusPayload,
	DockerStatusPayload,
	PortStatusPayload,
	GameStatusPayload,
	GrpcStatusPayload,
	CheckSnapshot,
	MonitorStats,
	CheckDiskInfo,
} from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";
import { IBufferService } from "./bufferService.js";
const SERVICE_NAME = "StatusService";

export interface IStatusService {
	updateRunningStats(monitor: Monitor, networkResponse: MonitorStatusResponse): Promise<boolean>;
	updateMonitorStatus(
		statusResponse: MonitorStatusResponse<
			| PingStatusPayload
			| HttpStatusPayload
			| PageSpeedStatusPayload
			| HardwareStatusPayload
			| DockerStatusPayload
			| PortStatusPayload
			| GameStatusPayload
			| GrpcStatusPayload
			| undefined
		>,
		check: Check
	): Promise<StatusChangeResult>;
}

export class StatusService implements IStatusService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private buffer: IBufferService;
	private monitorsRepository: IMonitorsRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private checksRepository: IChecksRepository;

	constructor(
		logger: ILogger,
		buffer: IBufferService,
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

	async updateRunningStats(monitor: Monitor, networkResponse: MonitorStatusResponse) {
		try {
			const monitorId = monitor.id;
			const { responseTime, status } = networkResponse;
			let existingStats: MonitorStats | null = null;
			existingStats = await this.monitorStatsRepository
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

			let stats: Omit<MonitorStats, "id" | "monitorId" | "createdAt" | "updatedAt">;

			if (!existingStats) {
				// Initialize new stats
				stats = {
					avgResponseTime: 0,
					maxResponseTime: 0,
					totalChecks: 0,
					totalUpChecks: 0,
					totalDownChecks: 0,
					uptimePercentage: 0,
					lastResponseTime: 0,
					lastCheckTimestamp: 0,
				};
			} else {
				// Use existing stats (omit id, monitorId, createdAt, updatedAt)
				stats = {
					avgResponseTime: existingStats.avgResponseTime,
					maxResponseTime: existingStats.maxResponseTime,
					totalChecks: existingStats.totalChecks,
					totalUpChecks: existingStats.totalUpChecks,
					totalDownChecks: existingStats.totalDownChecks,
					uptimePercentage: existingStats.uptimePercentage,
					lastResponseTime: existingStats.lastResponseTime,
					lastCheckTimestamp: existingStats.lastCheckTimestamp,
					timeOfLastFailure: existingStats.timeOfLastFailure,
				};
			}

			// Update stats
			stats.totalChecks++;

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

			// Create or update
			if (!existingStats) {
				await this.monitorStatsRepository.create({ monitorId, ...stats });
			} else {
				await this.monitorStatsRepository.updateByMonitorId(monitorId, stats);
			}

			return true;
		} catch (error: unknown) {
			this.logger.error({
				service: SERVICE_NAME,
				message: error instanceof Error ? error.message : "Unknown error",
				method: "updateRunningStats",
				stack: error instanceof Error ? error.stack : undefined,
			});
			return false;
		}
	}

	updateMonitorStatus = async (
		statusResponse: MonitorStatusResponse<
			| PingStatusPayload
			| HttpStatusPayload
			| PageSpeedStatusPayload
			| HardwareStatusPayload
			| DockerStatusPayload
			| PortStatusPayload
			| GameStatusPayload
			| GrpcStatusPayload
			| undefined
		>,
		check: Check
	): Promise<StatusChangeResult> => {
		try {
			const { monitorId, teamId, status, code } = statusResponse;
			const monitor = await this.monitorsRepository.findById(monitorId, teamId);

			// Update running stats
			this.updateRunningStats(monitor, statusResponse);

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
						metrics.disk?.some((d: CheckDiskInfo) => typeof d?.usage_percent === "number" && d.usage_percent > monitor.diskAlertThreshold / 100) ??
						false;

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

			// Update statusChangedAt if status changed
			if (statusChanged) {
				monitor.statusChangedAt = new Date().toISOString();
			}

			const updated = await this.monitorsRepository.updateById(monitor.id, monitor.teamId, monitor);

			return {
				monitor: updated,
				statusChanged,
				prevStatus,
				code,
				timestamp: new Date().getTime(),
				thresholdBreaches,
			};
		} catch (error: unknown) {
			throw new AppError({
				message: `Failed to update monitor with id ${check.metadata.monitorId} with status: ${error instanceof Error ? error.message : "Unknown error"}`,
				service: SERVICE_NAME,
				method: "updateMonitorStatus",
			});
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
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "insertCheck",
				details: { msg: `Error inserting check for monitor: ${check?.metadata.monitorId}` },
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};
}
