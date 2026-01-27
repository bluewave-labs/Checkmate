import { IMonitorsRepository } from "@/repositories/index.js";
import MonitorStats from "../../db/models/MonitorStats.js";
import { CheckModel } from "@/db/models/index.js";
import type {
	CheckErrorInfo,
	Monitor,
	MonitorStatusResponse,
	StatusChangeResult,
	Check,
	HardwareStatusPayload,
	PageSpeedStatusPayload,
	CheckSnapshot,
} from "@/types/index.js";
const SERVICE_NAME = "StatusService";

export interface IStatusService {
	updateRunningStats({ monitor, networkResponse }: { monitor: Monitor; networkResponse: any }): Promise<boolean>;
	getStatusString(status: boolean | undefined): string;
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

	constructor({ logger, buffer, monitorsRepository }: { logger: any; buffer: any; monitorsRepository: IMonitorsRepository }) {
		this.logger = logger;
		this.buffer = buffer;
		this.monitorsRepository = monitorsRepository;
	}

	get serviceName() {
		return StatusService.SERVICE_NAME;
	}

	async updateRunningStats({ monitor, networkResponse }: { monitor: Monitor; networkResponse: any }) {
		try {
			const monitorId = monitor.id;
			const { responseTime, status } = networkResponse;
			// Get stats
			let stats = await MonitorStats.findOne({ monitorId });
			if (!stats) {
				stats = new MonitorStats({
					monitorId,
					avgResponseTime: 0,
					totalChecks: 0,
					totalUpChecks: 0,
					totalDownChecks: 0,
					uptimePercentage: 0,
					lastCheck: null,
				});
			}

			// Update stats

			// Last response time
			stats.lastResponseTime = responseTime;

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

			await stats.save();
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

	getStatusString = (status: boolean | undefined) => {
		if (status === true) return "up";
		if (status === false) return "down";
		return "unknown";
	};

	handleIncidentForCheck = async (check: Check, monitor: Monitor, action: any, errorContext = "incident handling") => {
		try {
			let savedCheck;
			if (!check.id) {
				try {
					const checkModel = new CheckModel(check);
					savedCheck = await checkModel.save();

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

			if (monitor.status === undefined || monitor.status === null) {
				monitor.status = status;
			}

			const prevStatus = monitor.status;
			let newStatus = monitor.status;
			let statusChanged = false;

			// Return early if not enough data points
			if (monitor.statusWindow.length < monitor.statusWindowSize) {
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
			if (failureRate >= monitor.statusWindowThreshold && monitor.status !== false) {
				newStatus = false;
				statusChanged = true;
			}
			// If the failure rate is below the threshold and the monitor is down, recover:
			else if (failureRate < monitor.statusWindowThreshold && monitor.status === false) {
				newStatus = true;
				statusChanged = true;
			}

			monitor.status = newStatus;
			const updated = await this.monitorsRepository.updateById(monitor.id, monitor.teamId, monitor);

			return {
				monitor: updated,
				statusChanged,
				prevStatus,
				code,
				timestamp: new Date().getTime(),
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
			this.buffer.addToBuffer({ check });
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
