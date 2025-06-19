import {
	getMonitorByIdParamValidation,
	getMonitorByIdQueryValidation,
	getMonitorsByTeamIdParamValidation,
	getMonitorsByTeamIdQueryValidation,
	createMonitorBodyValidation,
	createMonitorsBodyValidation,
	getMonitorURLByQueryValidation,
	editMonitorBodyValidation,
	pauseMonitorParamValidation,
	getMonitorStatsByIdParamValidation,
	getMonitorStatsByIdQueryValidation,
	getCertificateParamValidation,
	getHardwareDetailsByIdParamValidation,
	getHardwareDetailsByIdQueryValidation,
} from "../validation/joi.js";
import sslChecker from "ssl-checker";
import logger from "../utils/logger.js";
import { handleError, handleValidationError } from "./controllerUtils.js";
import axios from "axios";
import seedDb from "../db/mongo/utils/seedDb.js";
const SERVICE_NAME = "monitorController";
import pkg from "papaparse";

class MonitorController {
	constructor(db, settingsService, jobQueue, stringService, emailService) {
		this.db = db;
		this.settingsService = settingsService;
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.emailService = emailService;
	}

	/**
	 * Returns all monitors
	 * @async
	 * @param {Express.Request} req
	 * @param {Express.Response} res
	 * @param {function} next
	 * @returns {Promise<Express.Response>}
	 * @throws {Error}
	 */
	getAllMonitors = async (req, res, next) => {
		try {
			const monitors = await this.db.getAllMonitors();
			return res.success({
				msg: this.stringService.monitorGetAll,
				data: monitors,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getAllMonitors"));
		}
	};

	/**
	 * Returns all monitors with uptime stats for 1,7,30, and 90 days
	 * @async
	 * @param {Express.Request} req
	 * @param {Express.Response} res
	 * @param {function} next
	 * @returns {Promise<Express.Response>}
	 * @throws {Error}
	 */
	getAllMonitorsWithUptimeStats = async (req, res, next) => {
		try {
			const monitors = await this.db.getAllMonitorsWithUptimeStats();
			return res.success({
				msg: this.stringService.monitorGetAll,
				data: monitors,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getAllMonitorsWithUptimeStats"));
		}
	};

	getUptimeDetailsById = async (req, res, next) => {
		try {
			const { monitorId } = req.params;
			const { dateRange, normalize } = req.query;

			const data = await this.db.getUptimeDetailsById({
				monitorId,
				dateRange,
				normalize,
			});
			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMonitorDetailsById"));
		}
	};

	/**
	 * Returns monitor stats for monitor with matching ID
	 * @async
	 * @param {Express.Request} req
	 * @param {Express.Response} res
	 * @param {function} next
	 * @returns {Promise<Express.Response>}
	 * @throws {Error}
	 */
	getMonitorStatsById = async (req, res, next) => {
		try {
			await getMonitorStatsByIdParamValidation.validateAsync(req.params);
			await getMonitorStatsByIdQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			let { limit, sortOrder, dateRange, numToDisplay, normalize } = req.query;
			const { monitorId } = req.params;

			const monitorStats = await this.db.getMonitorStatsById({
				monitorId,
				limit,
				sortOrder,
				dateRange,
				numToDisplay,
				normalize,
			});
			return res.success({
				msg: this.stringService.monitorStatsById,
				data: monitorStats,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMonitorStatsById"));
		}
	};

	/**
	 * Get hardware details for a specific monitor by ID
	 * @async
	 * @param {Express.Request} req - Express request object containing monitorId in params
	 * @param {Express.Response} res - Express response object
	 * @param {Express.NextFunction} next - Express next middleware function
	 * @returns {Promise<Express.Response>}
	 * @throws {Error} - Throws error if monitor not found or other database errors
	 */
	getHardwareDetailsById = async (req, res, next) => {
		try {
			await getHardwareDetailsByIdParamValidation.validateAsync(req.params);
			await getHardwareDetailsByIdQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}
		try {
			const { monitorId } = req.params;
			const { dateRange } = req.query;
			const monitor = await this.db.getHardwareDetailsById({ monitorId, dateRange });
			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data: monitor,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getHardwareDetailsById"));
		}
	};

	getMonitorCertificate = async (req, res, next, fetchMonitorCertificate) => {
		try {
			await getCertificateParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
		}

		try {
			const { monitorId } = req.params;
			const monitor = await this.db.getMonitorById(monitorId);
			const certificate = await fetchMonitorCertificate(sslChecker, monitor);

			return res.success({
				msg: this.stringService.monitorCertificate,
				data: {
					certificateDate: new Date(certificate.validTo),
				},
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMonitorCertificate"));
		}
	};

	/**
	 * Retrieves a monitor by its ID.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.params - The parameters of the request.
	 * @property {string} req.params.monitorId - The ID of the monitor to be retrieved.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message, and the retrieved monitor data.
	 * @throws {Error} If there is an error during the process, especially if the monitor is not found (404) or if there is a validation error (422).
	 */
	getMonitorById = async (req, res, next) => {
		try {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await getMonitorByIdQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const monitor = await this.db.getMonitorById(req.params.monitorId);
			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data: monitor,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMonitorById"));
		}
	};

	/**
	 * Creates a new monitor and adds it to the job queue.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.body - The body of the request.
	 * @property {Array} req.body.notifications - The notifications associated with the monitor.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the creation of the monitor, and the created monitor data.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	createMonitor = async (req, res, next) => {
		try {
			await createMonitorBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const { _id, teamId } = req.user;
			const monitor = await this.db.createMonitor({
				body: req.body,
				teamId,
				userId: _id,
			});

			// Add monitor to job queue
			this.jobQueue.addJob(monitor._id, monitor);
			return res.success({
				msg: this.stringService.monitorCreate,
				data: monitor,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "createMonitor"));
		}
	};

	/**
	 * Creates bulk monitors and adds them to the job queue after parsing CSV.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.file - The uploaded CSV file.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status and message.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	createBulkMonitors = async (req, res, next) => {
		try {
			const { parse } = pkg;

			// validate the file
			if (!req.file) {
				throw new Error("No file uploaded");
			}

			// Check if the file is a CSV
			if (!req.file.mimetype.includes("csv")) {
				throw new Error("File is not a CSV");
			}

			// Validate if the file is empty
			if (req.file.size === 0) {
				throw new Error("File is empty");
			}

			const { _id, teamId } = req.user;

			if (!_id || !teamId) {
				throw new Error("Missing userId or teamId");
			}

			// Get file buffer from memory and convert to string
			const fileData = req.file.buffer.toString("utf-8");

			// Parse the CSV data
			parse(fileData, {
				header: true,
				skipEmptyLines: true,
				transform: (value, header) => {
					if (value === "") return undefined; // Empty fields become undefined

					// Handle 'port' and 'interval' fields, check if they're valid numbers
					if (["port", "interval"].includes(header)) {
						const num = parseInt(value, 10);
						if (isNaN(num)) {
							throw new Error(`${header} should be a valid number, got: ${value}`);
						}
						return num;
					}

					return value;
				},
				complete: async ({ data, errors }) => {
					try {
						if (errors.length > 0) {
							throw new Error("Error parsing CSV");
						}

						if (!data || data.length === 0) {
							throw new Error("CSV file contains no data rows");
						}

						const enrichedData = data.map((monitor) => ({
							userId: _id,
							teamId,
							...monitor,
							description: monitor.description || monitor.name || monitor.url,
							name: monitor.name || monitor.url,
							type: monitor.type || "http",
						}));

						await createMonitorsBodyValidation.validateAsync(enrichedData);

						try {
							const monitors = await this.db.createBulkMonitors(enrichedData);

							await Promise.all(
								monitors.map(async (monitor, index) => {
									this.jobQueue.addJob(monitor._id, monitor);
								})
							);

							return res.success({
								msg: this.stringService.bulkMonitorsCreate,
								data: monitors,
							});
						} catch (error) {
							next(handleError(error, SERVICE_NAME, "createBulkMonitors"));
						}
					} catch (error) {
						next(handleError(error, SERVICE_NAME, "createBulkMonitors"));
					}
				},
			});
		} catch (error) {
			return next(handleError(error, SERVICE_NAME, "createBulkMonitors"));
		}
	};
	/**
	 * Checks if the endpoint can be resolved
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.query - The query parameters of the request.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message, and the resolution result.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	checkEndpointResolution = async (req, res, next) => {
		try {
			await getMonitorURLByQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const { monitorURL } = req.query;
			const parsedUrl = new URL(monitorURL);
			const response = await axios.get(parsedUrl, {
				timeout: 5000,
				validateStatus: () => true,
			});
			return res.success({
				status: response.status,
				msg: response.statusText,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "checkEndpointResolution"));
		}
	};

	/**
	 * Deletes a monitor by its ID and also deletes associated checks, alerts, and notifications.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.params - The parameters of the request.
	 * @property {string} req.params.monitorId - The ID of the monitor to be deleted.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status and a message indicating the deletion of the monitor.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422) or an error in deleting associated records.
	 */
	deleteMonitor = async (req, res, next) => {
		try {
			await getMonitorByIdParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const monitorId = req.params.monitorId;
			const monitor = await this.db.deleteMonitor({ monitorId });
			await this.jobQueue.deleteJob(monitor);
			await this.db.deleteStatusPagesByMonitorId(monitor._id);
			return res.success({ msg: this.stringService.monitorDelete });
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteMonitor"));
		}
	};

	/**
	 * Deletes all monitors associated with a team.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.headers - The headers of the request.
	 * @property {string} req.headers.authorization - The authorization header containing the JWT token.
	 * @param {Object} res - The Express response object.
	 * @param {function} next
	 * @returns {Object} The response object with a success status and a message indicating the number of deleted monitors.
	 * @throws {Error} If there is an error during the deletion process.
	 */
	deleteAllMonitors = async (req, res, next) => {
		try {
			const { teamId } = req.user;
			const { monitors, deletedCount } = await this.db.deleteAllMonitors(teamId);
			await Promise.all(
				monitors.map(async (monitor) => {
					try {
						await this.jobQueue.deleteJob(monitor);
						await this.db.deleteChecks(monitor._id);
						await this.db.deletePageSpeedChecksByMonitorId(monitor._id);
						await this.db.deleteNotificationsByMonitorId(monitor._id);
					} catch (error) {
						logger.error({
							message: `Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`,
							service: SERVICE_NAME,
							method: "deleteAllMonitors",
							stack: error.stack,
						});
					}
				})
			);
			return res.success({ msg: `Deleted ${deletedCount} monitors` });
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteAllMonitors"));
		}
	};

	/**
	 * Edits a monitor by its ID, updates its notifications, and updates its job in the job queue.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.params - The parameters of the request.
	 * @property {string} req.params.monitorId - The ID of the monitor to be edited.
	 * @property {Object} req.body - The body of the request.
	 * @property {Array} req.body.notifications - The notifications to be associated with the monitor.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the editing of the monitor, and the edited monitor data.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	editMonitor = async (req, res, next) => {
		try {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await editMonitorBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const { monitorId } = req.params;

			const editedMonitor = await this.db.editMonitor(monitorId, req.body);

			await this.jobQueue.updateJob(editedMonitor);

			return res.success({
				msg: this.stringService.monitorEdit,
				data: editedMonitor,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "editMonitor"));
		}
	};

	/**
	 * Pauses or resumes a monitor based on its current state.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.params - The parameters of the request.
	 * @property {string} req.params.monitorId - The ID of the monitor to be paused or resumed.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the new state of the monitor, and the updated monitor data.
	 * @throws {Error} If there is an error during the process.
	 */
	pauseMonitor = async (req, res, next) => {
		try {
			await pauseMonitorParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
		}

		try {
			const monitorId = req.params.monitorId;
			const monitor = await this.db.pauseMonitor({ monitorId });
			monitor.isActive === true
				? await this.jobQueue.resumeJob(monitor._id, monitor)
				: await this.jobQueue.pauseJob(monitor);

			return res.success({
				msg: monitor.isActive
					? this.stringService.monitorResume
					: this.stringService.monitorPause,
				data: monitor,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "pauseMonitor"));
		}
	};

	/**
	 * Adds demo monitors for a team.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.headers - The headers of the request.
	 * @property {string} req.headers.authorization - The authorization header containing the JWT token.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the addition of demo monitors, and the number of demo monitors added.
	 * @throws {Error} If there is an error during the process.
	 */
	addDemoMonitors = async (req, res, next) => {
		try {
			const { _id, teamId } = req.user;
			const demoMonitors = await this.db.addDemoMonitors(_id, teamId);
			await Promise.all(
				demoMonitors.map((monitor) => this.jobQueue.addJob(monitor._id, monitor))
			);

			return res.success({
				msg: this.stringService.monitorDemoAdded,
				data: demoMonitors.length,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "addDemoMonitors"));
		}
	};

	/**
	 * Sends a test email to verify email delivery functionality.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.to - The email address to send the test email to.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status and the email delivery message ID.
	 * @throws {Error} If there is an error while sending the test email.
	 */
	sendTestEmail = async (req, res, next) => {
		try {
			const { to } = req.body;
			if (!to || typeof to !== "string") {
				throw new Error(this.stringService.errorForValidEmailAddress);
			}

			const subject = this.stringService.testEmailSubject;
			const context = { testName: "Monitoring System" };

			const html = await this.emailService.buildEmail("testEmailTemplate", context);
			const messageId = await this.emailService.sendEmail(to, subject, html);

			if (!messageId) {
				return res.error({
					msg: "Failed to send test email.",
				});
			}

			return res.success({
				msg: this.stringService.sendTestEmail,
				data: { messageId },
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "sendTestEmail"));
		}
	};

	getMonitorsByTeamId = async (req, res, next) => {
		try {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
		}

		try {
			let { limit, type, page, rowsPerPage, filter, field, order } = req.query;
			const teamId = req.user.teamId;

			const monitors = await this.db.getMonitorsByTeamId({
				limit,
				type,
				page,
				rowsPerPage,
				filter,
				field,
				order,
				teamId,
			});
			return res.success({
				msg: this.stringService.monitorGetByTeamId,
				data: monitors,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMonitorsByTeamId"));
		}
	};

	getMonitorsAndSummaryByTeamId = async (req, res, next) => {
		try {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);
		} catch (error) {
			return next(handleValidationError(error, SERVICE_NAME));
		}

		try {
			const { explain } = req;
			const { type } = req.query;
			const { teamId } = req.user;

			const result = await this.db.getMonitorsAndSummaryByTeamId({
				type,
				explain,
				teamId,
			});
			return res.success({
				msg: "OK", // TODO
				data: result,
			});
		} catch (error) {
			return next(handleError(error, SERVICE_NAME, "getMonitorsAndSummaryByTeamId"));
		}
	};

	getMonitorsWithChecksByTeamId = async (req, res, next) => {
		try {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);
		} catch (error) {
			return next(handleValidationError(error, SERVICE_NAME));
		}

		try {
			const { explain } = req;
			let { limit, type, page, rowsPerPage, filter, field, order } = req.query;
			const { teamId } = req.user;

			const result = await this.db.getMonitorsWithChecksByTeamId({
				limit,
				type,
				page,
				rowsPerPage,
				filter,
				field,
				order,
				teamId,
				explain,
			});
			return res.success({
				msg: "OK", // TODO
				data: result,
			});
		} catch (error) {
			return next(handleError(error, SERVICE_NAME, "getMonitorsWithChecksByTeamId"));
		}
	};

	seedDb = async (req, res, next) => {
		try {
			const { _id, teamId } = req.user;
			await seedDb(_id, teamId);
			res.success({ msg: "Database seeded" });
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "seedDb"));
		}
	};
}

export default MonitorController;
