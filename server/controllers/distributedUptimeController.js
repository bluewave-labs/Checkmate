import { handleError } from "./controllerUtils.js";
import Monitor from "../db/models/Monitor.js";
import DistributedUptimeCheck from "../db/models/DistributedUptimeCheck.js";
const SERVICE_NAME = "DistributedUptimeQueueController";

class DistributedUptimeController {
	constructor({ db, http, statusService, logger }) {
		this.db = db;
		this.http = http;
		this.statusService = statusService;
		this.logger = logger;
		this.resultsCallback = this.resultsCallback.bind(this);
		this.getDistributedUptimeMonitors = this.getDistributedUptimeMonitors.bind(this);
		this.subscribeToDistributedUptimeMonitors =
			this.subscribeToDistributedUptimeMonitors.bind(this);

		this.subscribeToDistributedUptimeMonitorDetails =
			this.subscribeToDistributedUptimeMonitorDetails.bind(this);
		this.getDistributedUptimeMonitorDetails =
			this.getDistributedUptimeMonitorDetails.bind(this);
	}

	async resultsCallback(req, res, next) {
		try {
			const { id, result } = req.body;
			// Calculate response time
			const {
				first_byte_took,
				body_read_took,
				dns_took,
				conn_took,
				connect_took,
				tls_took,
				status_code,
				error,
				upt_burnt,
			} = result;

			// Calculate response time
			const responseTime = first_byte_took / 1_000_000;
			if (!isFinite(responseTime) || responseTime <= 0 || responseTime > 30000) {
				this.logger.info({
					message: `Unreasonable response time detected: ${responseTime}ms from first_byte_took: ${first_byte_took}ns`,
					service: SERVICE_NAME,
					method: "resultsCallback",
				});
				return;
			}

			// Calculate if server is up or down
			let isSelfSigned = false;
			const isErrorStatus = status_code >= 400;
			const hasError = error !== "";
 			if(error === 'DEPTH_ZERO_SELF_SIGNED_CERT' || error === 'SELF_SIGNED_CERT_IN_CHAIN'){
 				const monitor = await getMonitorById(id)
 				isSelfSigned = monitor.insecureSkipVerify
 				}

			const status = isErrorStatus || hasError ? false : true;

			// Build response
			const distributedUptimeResponse = {
				monitorId: id,
				type: "distributed_http",
				payload: result,
				status,
				code: status_code,
				responseTime,
				first_byte_took,
				body_read_took,
				dns_took,
				conn_took,
				connect_took,
				tls_took,
				upt_burnt,
			};
			if (error) {
				const code = status_code || this.NETWORK_ERROR;
				distributedUptimeResponse.code = code;
				distributedUptimeResponse.message =
					this.http.STATUS_CODES[code] || "Network Error";
			} else {
				distributedUptimeResponse.message = this.http.STATUS_CODES[status_code];
			}

			await this.statusService.updateStatus(distributedUptimeResponse);

			res.status(200).json({ message: "OK" });
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "resultsCallback"));
		}
	}

	async getDistributedUptimeMonitors(req, res, next) {
		try {
			const monitors = await this.db.getMonitorsWithChecksByTeamId(req);
			return res.success({
				msg: "OK",
				data: monitors,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getDistributedUptimeMonitors"));
		}
	}

	async subscribeToDistributedUptimeMonitors(req, res, next) {
		try {
			res.setHeader("Content-Type", "text/event-stream");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");
			res.setHeader("Access-Control-Allow-Origin", "*");
			// Disable compression
			req.headers["accept-encoding"] = "identity";
			res.removeHeader("Content-Encoding");
			const BATCH_DELAY = 1000;
			let batchTimeout = null;
			let opInProgress = false;
			let monitorStream = null;
			let checksStream = null;

			// Do things here
			const notifyChange = async () => {
				if (opInProgress) {
					// Get data
					const { count, monitors } = await this.db.getMonitorsWithChecksByTeamId(req);
					res.write(`data: ${JSON.stringify({ count, monitors })}\n\n`);
					opInProgress = false;
				}
				batchTimeout = null;
			};

			const handleChange = () => {
				opInProgress = true;
				if (batchTimeout) clearTimeout(batchTimeout);
				batchTimeout = setTimeout(notifyChange, BATCH_DELAY);
			};

			const createMonitorStream = () => {
				if (monitorStream) {
					try {
						monitorStream.close();
					} catch (error) {
						this.logger.error({
							message: "Error closing monitor stream",
							service: SERVICE_NAME,
							method: "subscribeToDistributedUptimeMonitors",
							stack: error.stack,
						});
					}
				}
				monitorStream = Monitor.watch(
					[{ $match: { operationType: { $in: ["insert", "update", "delete"] } } }],
					{ fullDocument: "updateLookup" }
				);

				monitorStream.on("change", handleChange);
				monitorStream.on("error", (error) => {
					this.logger.error({
						message: "Error in monitor stream",
						service: SERVICE_NAME,
						method: "subscribeToDistributedUptimeMonitors",
						stack: error.stack,
					});
					createMonitorStream();
				});
				monitorStream.on("close", () => {
					monitorStream = null;
				});
			};

			const createChecksStream = () => {
				if (checksStream) {
					try {
						checksStream.close();
					} catch (error) {
						this.logger.error({
							message: "Error closing checks stream",
							service: SERVICE_NAME,
							method: "subscribeToDistributedUptimeMonitors",
							details: error,
						});
					}
				}
				checksStream = DistributedUptimeCheck.watch(
					[{ $match: { operationType: { $in: ["insert", "update", "delete"] } } }],
					{ fullDocument: "updateLookup" }
				);
				checksStream.on("change", handleChange);
				checksStream.on("error", (error) => {
					this.logger.error({
						message: "Error in checks stream",
						service: SERVICE_NAME,
						method: "subscribeToDistributedUptimeMonitors",
						stack: error.stack,
					});
					createChecksStream();
				});
				checksStream.on("close", () => {
					checksStream = null;
				});
			};

			createMonitorStream();
			createChecksStream();

			req.on("close", () => {
				if (batchTimeout) {
					clearTimeout(batchTimeout);
				}
				monitorStream.close();
				checksStream.close();
				clearInterval(keepAlive);
			});

			// Keep connection alive
			const keepAlive = setInterval(() => {
				res.write(": keepalive\n\n");
			}, 10000);

			// Clean up on close
			req.on("close", () => {
				clearInterval(keepAlive);
			});
		} catch (error) {
			this.logger.error({
				message: "Error in subscribeToDistributedUptimeMonitors",
				service: SERVICE_NAME,
				method: "subscribeToDistributedUptimeMonitors",
				stack: error.stack,
			});
			next(handleError(error, SERVICE_NAME, "subscribeToDistributedUptimeMonitors"));
		}
	}

	async getDistributedUptimeMonitorDetails(req, res, next) {
		try {
			const monitor = await this.db.getDistributedUptimeDetailsById(req);
			return res.success({
				msg: "OK",
				data: monitor,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getDistributedUptimeMonitorDetails"));
		}
	}

	async subscribeToDistributedUptimeMonitorDetails(req, res, next) {
		try {
			res.setHeader("Content-Type", "text/event-stream");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");
			res.setHeader("Access-Control-Allow-Origin", "*");

			// disable compression
			req.headers["accept-encoding"] = "identity";
			res.removeHeader("Content-Encoding");

			const BATCH_DELAY = 1000;
			let batchTimeout = null;
			let opInProgress = false;
			let checksStream = null;
			// Do things here
			const notifyChange = async () => {
				try {
					if (opInProgress) {
						// Get data
						const monitor = await this.db.getDistributedUptimeDetailsById(req);
						res.write(`data: ${JSON.stringify({ monitor })}\n\n`);
						opInProgress = false;
					}
					batchTimeout = null;
				} catch (error) {
					opInProgress = false;
					batchTimeout = null;
					this.logger.error({
						message: "Error in notifyChange",
						service: SERVICE_NAME,
						method: "subscribeToDistributedUptimeMonitorDetails",
						stack: error.stack,
					});
					next(handleError(error, SERVICE_NAME, "getDistributedUptimeMonitorDetails"));
				}
			};

			const handleChange = () => {
				opInProgress = true;
				if (batchTimeout) clearTimeout(batchTimeout);
				batchTimeout = setTimeout(notifyChange, BATCH_DELAY);
			};

			const createCheckStream = () => {
				if (checksStream) {
					try {
						checksStream.close();
					} catch (error) {
						this.logger.error({
							message: "Error closing checks stream",
							service: SERVICE_NAME,
							method: "subscribeToDistributedUptimeMonitorDetails",
							stack: error.stack,
						});
					}
				}
				checksStream = DistributedUptimeCheck.watch(
					[{ $match: { operationType: { $in: ["insert", "update", "delete"] } } }],
					{ fullDocument: "updateLookup" }
				);

				checksStream.on("change", handleChange);
				checksStream.on("error", (error) => {
					this.logger.error({
						message: "Error in checks stream",
						service: SERVICE_NAME,
						method: "subscribeToDistributedUptimeMonitorDetails",
						stack: error.stack,
					});
					createCheckStream();
				});
				checksStream.on("close", () => {
					checksStream = null;
				});
			};

			createCheckStream();

			// Handle client disconnect
			req.on("close", () => {
				if (batchTimeout) {
					clearTimeout(batchTimeout);
				}
				checksStream.close();
				clearInterval(keepAlive);
			});

			// Keep connection alive
			const keepAlive = setInterval(() => {
				res.write(": keepalive\n\n");
			}, 10000);
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getDistributedUptimeMonitorDetails"));
		}
	}
}
export default DistributedUptimeController;
