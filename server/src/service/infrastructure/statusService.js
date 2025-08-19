import MonitorStats from "../../db/models/MonitorStats.js";
const SERVICE_NAME = "StatusService";

class StatusService {
	static SERVICE_NAME = SERVICE_NAME;

	/**
	 * @param {{
	 *  buffer: import("./bufferService.js").BufferService
	 * }}
	 */ constructor({ db, logger, buffer }) {
		this.db = db;
		this.logger = logger;
		this.buffer = buffer;
	}

	get serviceName() {
		return StatusService.SERVICE_NAME;
	}

	async updateRunningStats({ monitor, networkResponse }) {
		try {
			const monitorId = monitor._id;
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
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				message: error.message,
				method: "updateRunningStats",
				stack: error.stack,
			});
			return false;
		}
	}

	getStatusString = (status) => {
		if (status === true) return "up";
		if (status === false) return "down";
		return "unknown";
	};
	/**
	 * Updates the status of a monitor based on the network response.
	 *
	 * @param {Object} networkResponse - The network response containing monitorId and status.
	 * @param {string} networkResponse.monitorId - The ID of the monitor.
	 * @param {string} networkResponse.status - The new status of the monitor.
	 * @returns {Promise<Object>} - A promise that resolves to an object containinfg the monitor, statusChanged flag, and previous status if the status changed, or false if an error occurred.
	 * @returns {Promise<Object>} returnObject - The object returned by the function.
	 * @returns {Object} returnObject.monitor - The monitor object.
	 * @returns {boolean} returnObject.statusChanged - Flag indicating if the status has changed.
	 * @returns {boolean} returnObject.prevStatus - The previous status of the monitor
	 */
	updateStatus = async (networkResponse) => {
		const check = this.buildCheck(networkResponse);
		await this.insertCheck(check);
		try {
			const { monitorId, status, code } = networkResponse;
			const monitor = await this.db.monitorModule.getMonitorById(monitorId);

			// Update running stats
			this.updateRunningStats({ monitor, networkResponse });

			// Update status sliding window
			monitor.statusWindow.push(status);
			if (monitor.statusWindow.length > monitor.statusWindowSize) {
				monitor.statusWindow.shift();
			}

			if (!monitor.status) {
				monitor.status = status;
			}

			let newStatus = monitor.status;
			let statusChanged = false;
			const prevStatus = monitor.status;

			// Return early if not enough data points
			if (monitor.statusWindow.length < monitor.statusWindowSize) {
				await monitor.save();
				return {
					monitor,
					statusChanged: false,
					prevStatus,
					code,
					timestamp: Date.now(),
				};
			}

			// Check if threshold has been met
			const failures = monitor.statusWindow.filter((s) => s === false).length;
			const failureRate = failures / monitor.statusWindow.length;

			// If threshold has been met and the monitor is not already down, mark down:
			if (failureRate > monitor.statusWindowThreshold && monitor.status !== false) {
				newStatus = false;
				statusChanged = true;
			}
			// If the failure rate is below the threshold and the monitor is down, recover:
			else if (failureRate <= monitor.statusWindowThreshold && monitor.status === false) {
				newStatus = true;
				statusChanged = true;
			}

			if (statusChanged) {
				this.logger.info({
					service: this.SERVICE_NAME,
					message: `${monitor.name} went from ${this.getStatusString(prevStatus)} to ${this.getStatusString(newStatus)}`,
					prevStatus,
					newStatus,
				});
			}

			monitor.status = newStatus;
			await monitor.save();

			return {
				monitor,
				statusChanged,
				prevStatus,
				code,
				timestamp: new Date().getTime(),
			};
		} catch (error) {
			error.service = this.SERVICE_NAME;
			error.method = "updateStatus";
			throw error;
		}
	};

	/**
	 * Builds a check object from the network response.
	 *
	 * @param {Object} networkResponse - The network response object.
	 * @param {string} networkResponse.monitorId - The monitor ID.
	 * @param {string} networkResponse.type - The type of the response.
	 * @param {string} networkResponse.status - The status of the response.
	 * @param {number} networkResponse.responseTime - The response time.
	 * @param {number} networkResponse.code - The status code.
	 * @param {string} networkResponse.message - The message.
	 * @param {Object} networkResponse.payload - The payload of the response.
	 * @returns {Object} The check object.
	 */
	buildCheck = (networkResponse) => {
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
			monitorId,
			teamId,
			type,
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
					service: this.SERVICE_NAME,
					method: "buildCheck",
					details: "empty payload",
				});
				return undefined;
			}
			const categories = payload?.lighthouseResult?.categories ?? {};
			const audits = payload?.lighthouseResult?.audits ?? {};
			const {
				"cumulative-layout-shift": cls = 0,
				"speed-index": si = 0,
				"first-contentful-paint": fcp = 0,
				"largest-contentful-paint": lcp = 0,
				"total-blocking-time": tbt = 0,
			} = audits;
			check.accessibility = (categories?.accessibility?.score || 0) * 100;
			check.bestPractices = (categories?.["best-practices"]?.score || 0) * 100;
			check.seo = (categories?.seo?.score || 0) * 100;
			check.performance = (categories?.performance?.score || 0) * 100;
			check.audits = { cls, si, fcp, lcp, tbt };
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
	insertCheck = async (check) => {
		try {
			if (typeof check === "undefined") {
				this.logger.warn({
					message: "Failed to build check",
					service: this.SERVICE_NAME,
					method: "insertCheck",
				});
				return false;
			}
			this.buffer.addToBuffer({ check });
			return true;
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: error.service || this.SERVICE_NAME,
				method: error.method || "insertCheck",
				details: error.details || `Error inserting check for monitor: ${check?.monitorId}`,
				stack: error.stack,
			});
		}
	};
}
export default StatusService;
