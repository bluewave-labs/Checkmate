import { IMonitorsRepository } from "@/repositories/index.js";
import MonitorStats from "../../db/models/MonitorStats.js";
import { CheckModel } from "@/db/models/index.js";
import type { Monitor } from "@/types/index.js";
const SERVICE_NAME = "StatusService";

class StatusService {
	static SERVICE_NAME = SERVICE_NAME;
	private db: any;
	private logger: any;
	private buffer: any;
	private incidentService: any;
	private monitorsRepository: IMonitorsRepository;

	constructor({
		db,
		logger,
		buffer,
		incidentService,
		monitorsRepository,
	}: {
		db: any;
		logger: any;
		buffer: any;
		incidentService: any;
		monitorsRepository: IMonitorsRepository;
	}) {
		this.db = db;
		this.logger = logger;
		this.buffer = buffer;
		this.incidentService = incidentService;
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

	handleIncidentForCheck = async (check: any, monitor: Monitor, action: any, errorContext = "incident handling") => {
		try {
			let savedCheck = check;

			if (!check._id) {
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

			if (savedCheck && savedCheck._id) {
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

	updateStatus = async (networkResponse: any) => {
		const check = this.buildCheck(networkResponse);
		await this.insertCheck(check);
		try {
			const { monitorId, teamId, status, code } = networkResponse;
			const monitor = await this.monitorsRepository.findById(monitorId, teamId);

			// Update running stats
			this.updateRunningStats({ monitor, networkResponse });

			// If the status window size has changed, empty
			while (monitor.statusWindow.length > monitor.statusWindowSize) {
				monitor.statusWindow.shift();
			}

			// Update status sliding window
			monitor.statusWindow.push(status);
			if (monitor.statusWindow.length > monitor.statusWindowSize) {
				monitor.statusWindow.shift();
			}

			if (monitor.status === undefined || monitor.status === null) {
				monitor.status = status;
			}

			let newStatus = monitor.status;
			let statusChanged = false;
			const prevStatus = monitor.status;

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

			if (statusChanged) {
				this.logger.info({
					service: SERVICE_NAME,
					message: `${monitor.name} went from ${this.getStatusString(prevStatus)} to ${this.getStatusString(newStatus)}`,
					prevStatus,
					newStatus,
				});

				if (newStatus === false) {
					await this.handleIncidentForCheck(check, monitor, "create", "status change to down");
				} else if (prevStatus === false) {
					await this.handleIncidentForCheck(check, monitor, "resolve", "status change to up");
				}
			}

			if (monitor.status === false && !statusChanged) {
				try {
					const lastManuallyResolvedIncident = await this.db.incidentModule.getLastManuallyResolvedIncident(monitor.id);

					let calculatedFailureRate = failureRate;

					if (lastManuallyResolvedIncident && lastManuallyResolvedIncident.endTime) {
						try {
							const checksAfterResolution = await CheckModel.find({
								monitorId: monitor.id,
								createdAt: { $gt: lastManuallyResolvedIncident.endTime },
							})
								.sort({ createdAt: 1 })
								.limit(monitor.statusWindowSize)
								.select("status")
								.lean();

							if (checksAfterResolution.length > 0) {
								const checksStatuses = checksAfterResolution.map((c) => c.status);
								const failuresAfterResolution = checksStatuses.filter((s) => s === false).length;
								calculatedFailureRate = (failuresAfterResolution / monitor.statusWindow.length) * 100;
							} else {
								calculatedFailureRate = 0;
							}
						} catch (checkQueryError: any) {
							this.logger.error({
								service: SERVICE_NAME,
								method: "updateStatus",
								message: `Failed to query checks after manual resolution: ${checkQueryError.message}`,
								monitorId: monitor.id,
								stack: checkQueryError.stack,
							});
						}
					}

					if (calculatedFailureRate >= monitor.statusWindowThreshold) {
						await this.handleIncidentForCheck(check, monitor, "create", "threshold check without status change");
					}
				} catch (error: any) {
					this.logger.error({
						service: SERVICE_NAME,
						method: "updateStatus",
						message: `Error handling threshold check without status change: ${error.message}`,
						monitorId: monitor.id,
						stack: error.stack,
					});
				}
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

	buildCheck = (networkResponse: any) => {
		const {
			monitorId,
			teamId,
			type,
			status,
			responseTime,
			code,
			message,
			payload,
			first_byte_took,
			body_read_took,
			dns_took,
			conn_took,
			connect_took,
			tls_took,
			timings,
		} = networkResponse;

		const check = {
			metadata: {
				monitorId,
				teamId,
				type,
			},
			status,
			statusCode: code,
			responseTime,
			timings: timings || {},
			message,
			first_byte_took,
			body_read_took,
			dns_took,
			conn_took,
			connect_took,
			tls_took,
		};

		if (type === "pagespeed") {
			if (typeof payload === "undefined") {
				this.logger.warn({
					message: "Failed to build check",
					service: SERVICE_NAME,
					method: "buildCheck",
					details: "empty payload",
				});
				return undefined;
			}
			const categories = payload?.lighthouseResult?.categories ?? {};
			const audits = payload?.lighthouseResult?.audits ?? {};
			const mapAudit = (audit: any) => {
				if (!audit || typeof audit !== "object") {
					return undefined;
				}
				return {
					id: audit.id,
					title: audit.title,
					score: typeof audit.score === "number" ? audit.score : (audit.score ?? null),
					displayValue: audit.displayValue,
					numericValue: typeof audit.numericValue === "number" ? audit.numericValue : undefined,
					numericUnit: audit.numericUnit,
				};
			};
			check.accessibility = (categories?.accessibility?.score || 0) * 100;
			check.bestPractices = (categories?.["best-practices"]?.score || 0) * 100;
			check.seo = (categories?.seo?.score || 0) * 100;
			check.performance = (categories?.performance?.score || 0) * 100;
			check.audits = {
				cls: mapAudit(audits?.["cumulative-layout-shift"]),
				si: mapAudit(audits?.["speed-index"]),
				fcp: mapAudit(audits?.["first-contentful-paint"]),
				lcp: mapAudit(audits?.["largest-contentful-paint"]),
				tbt: mapAudit(audits?.["total-blocking-time"]),
			};
		}

		if (type === "hardware") {
			const { cpu, memory, disk, host, net } = payload?.data ?? {};
			const { errors } = payload?.errors ?? [];
			check.cpu = cpu ?? {};
			check.memory = memory ?? {};
			check.disk = disk ?? {};
			check.host = host ?? {};
			check.errors = errors ?? [];
			check.capture = payload?.capture ?? {};
			check.net = net ?? {};
		}
		return check;
	};

	/**
	 * Inserts a check into the database based on the network response.
	 *
	 * @param {Object} networkResponse - The network response object.
	 * @param {string} networkResponse.monitorId - The monitor ID.
	 * @param {string} networkResponse.type - The type of the response.
	 * @param {string} networkResponse.status - The status of the response.
	 * @param {number} networkResponse.responseTime - The response time.
	 * @param {number} networkResponse.code - The status code.
	 * @param {string} networkResponse.message - The message.
	 * @param {Object} networkResponse.payload - The payload of the response.
	 * @returns {Promise<void>} A promise that resolves when the check is inserted.
	 */
	insertCheck = async (check: any) => {
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
				details: error.details || `Error inserting check for monitor: ${check?.monitorId}`,
				stack: error.stack,
			});
		}
	};
}
export default StatusService;
