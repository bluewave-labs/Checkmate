import MonitorStats from "../db/models/MonitorStats.js";
import { safelyParseFloat } from "../utils/dataUtils.js";
const SERVICE_NAME = "StatusService";

class StatusService {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Creates an instance of StatusService.
	 *
	 * @param {Object} db - The database instance.
	 * @param {Object} logger - The logger instance.
	 */
	constructor({ db, logger, buffer }) {
		this.db = db;
		this.logger = logger;
		this.buffer = buffer;
		this.SERVICE_NAME = SERVICE_NAME;
	}

	async updateRunningStats({ monitor, networkResponse }) {
		try {
			const monitorId = monitor._id;
			const { responseTime, status, upt_burnt } = networkResponse;
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
					timeSInceLastCheck: 0,
					uptBurnt: 0,
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
					avgResponseTime =
						(avgResponseTime * (stats.totalChecks - 1) + responseTime) /
						stats.totalChecks;
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

			// UPT burned
			if (typeof upt_burnt !== "undefined" && upt_burnt !== null) {
				const currentUptBurnt = safelyParseFloat(stats.uptBurnt);
				const newUptBurnt = safelyParseFloat(upt_burnt);
				stats.uptBurnt = currentUptBurnt + newUptBurnt;
			}
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
		this.insertCheck(networkResponse);
		try {
			const { monitorId, status, code } = networkResponse;
			const monitor = await this.db.getMonitorById(monitorId);
	
			// Update running stats
			this.updateRunningStats({ monitor, networkResponse });
	
			// No change in monitor status, return early
			if (monitor.status === status)
				return {
					monitor,
					statusChanged: false,
					prevStatus: monitor.status,
					code,
					timestamp: new Date().getTime(),
				};
	
			// Monitor status changed, save prev status and update monitor
			this.logger.info({
				service: this.SERVICE_NAME,
				message: `${monitor.name} went from ${this.getStatusString(
					monitor.status
				)} to ${this.getStatusString(status)}`,
				prevStatus: monitor.status,
				newStatus: status,
			});
	
			const prevStatus = monitor.status;
			monitor.status = status;
			await monitor.save();
	
			return {
				monitor,
				statusChanged: true,
				prevStatus,
				code,
				timestamp: new Date().getTime(),
			};
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				message: error.message,
				method: "updateStatus",
				stack: error.stack,
			});
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
		} = networkResponse;

		const check = {
			monitorId,
			teamId,
			status,
			statusCode: code,
			responseTime,
			message,
			first_byte_took,
			body_read_took,
			dns_took,
			conn_took,
			connect_took,
			tls_took,
		};

		if (type === "distributed_http") {
			if (typeof payload === "undefined") {
				return undefined;
			}
			check.continent = payload.continent;
			check.countryCode = payload.country_code;
			check.city = payload.city;
			check.location = payload.location;
			check.uptBurnt = payload.upt_burnt;
			check.first_byte_took = payload.first_byte_took;
			check.body_read_took = payload.body_read_took;
			check.dns_took = payload.dns_took;
			check.conn_took = payload.conn_took;
			check.connect_took = payload.connect_took;
			check.tls_took = payload.tls_took;
		}

		if (type === "pagespeed") {
			if (typeof payload === "undefined") {
				return undefined;
			}
			console.log("[DEBUG] Payload:", networkResponse.payload);
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
			const { cpu, memory, disk, host } = payload?.data ?? {};
			const { errors } = payload?.errors ?? [];
			check.cpu = cpu ?? {};
			check.memory = memory ?? {};
			check.disk = disk ?? {};
			check.host = host ?? {};
			check.errors = errors ?? [];
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
	insertCheck = async (networkResponse) => {
		try {
			const check = this.buildCheck(networkResponse);
			if (typeof check === "undefined") {
				this.logger.warn({
					message: "Failed to build check",
					service: this.SERVICE_NAME,
					method: "insertCheck",
					details: networkResponse,
				});
				return;
			}
			this.buffer.addToBuffer({ check, type: networkResponse.type });
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "insertCheck",
				details: `Error inserting check for monitor: ${networkResponse?.monitorId}`,
				stack: error.stack,
			});
		}
	};
}
export default StatusService;
