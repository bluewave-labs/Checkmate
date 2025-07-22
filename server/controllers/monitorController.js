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
import axios from "axios";
import seedDb from "../db/mongo/utils/seedDb.js";
import pkg from "papaparse";
import { asyncHandler, createServerError } from "../utils/errorUtils.js";
import { fetchMonitorCertificate } from "./controllerUtils.js";

const SERVICE_NAME = "monitorController";
class MonitorController {
	constructor(db, settingsService, jobQueue, stringService, emailService) {
		this.db = db;
		this.settingsService = settingsService;
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.emailService = emailService;
	}

	async verifyTeamAccess(teamId, monitorId) {
		const monitor = await this.db.getMonitorById(monitorId);
		if (!monitor.teamId.equals(teamId)) {
			const error = new Error("Unauthorized");
			error.status = 403;
			throw error;
		}
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
	getAllMonitors = asyncHandler(
		async (req, res, next) => {
			const monitors = await this.db.getAllMonitors();
			return res.success({
				msg: this.stringService.monitorGetAll,
				data: monitors,
			});
		},
		SERVICE_NAME,
		"getAllMonitors"
	);

	getUptimeDetailsById = asyncHandler(
		async (req, res, next) => {
			const { monitorId } = req.params;
			const { dateRange, normalize } = req.query;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			await this.verifyTeamAccess(teamId, monitorId);

			const data = await this.db.getUptimeDetailsById({
				monitorId,
				dateRange,
				normalize,
			});
			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data,
			});
		},
		SERVICE_NAME,
		"getUptimeDetailsById"
	);

	/**
	 * Returns monitor stats for monitor with matching ID
	 * @async
	 * @param {Express.Request} req
	 * @param {Express.Response} res
	 * @param {function} next
	 * @returns {Promise<Express.Response>}
	 * @throws {Error}
	 */
	getMonitorStatsById = asyncHandler(
		async (req, res, next) => {
			await getMonitorStatsByIdParamValidation.validateAsync(req.params);
			await getMonitorStatsByIdQueryValidation.validateAsync(req.query);

			let { limit, sortOrder, dateRange, numToDisplay, normalize } = req.query;
			const { monitorId } = req.params;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			await this.verifyTeamAccess(teamId, monitorId);

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
		},
		SERVICE_NAME,
		"getMonitorStatsById"
	);

	/**
	 * Get hardware details for a specific monitor by ID
	 * @async
	 * @param {Express.Request} req - Express request object containing monitorId in params
	 * @param {Express.Response} res - Express response object
	 * @param {Express.NextFunction} next - Express next middleware function
	 * @returns {Promise<Express.Response>}
	 * @throws {Error} - Throws error if monitor not found or other database errors
	 */
	getHardwareDetailsById = asyncHandler(
		async (req, res, next) => {
			await getHardwareDetailsByIdParamValidation.validateAsync(req.params);
			await getHardwareDetailsByIdQueryValidation.validateAsync(req.query);

			const monitorId = req?.params?.monitorId;
			const dateRange = req?.query?.dateRange;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			await this.verifyTeamAccess(teamId, monitorId);
			const monitor = await this.db.getHardwareDetailsById({ monitorId, dateRange });
			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data: monitor,
			});
		},
		SERVICE_NAME,
		"getHardwareDetailsById"
	);

	getMonitorCertificate = asyncHandler(
		async (req, res, next) => {
			await getCertificateParamValidation.validateAsync(req.params);

			const { monitorId } = req.params;
			const monitor = await this.db.getMonitorById(monitorId);
			const certificate = await fetchMonitorCertificate(sslChecker, monitor);

			return res.success({
				msg: this.stringService.monitorCertificate,
				data: {
					certificateDate: new Date(certificate.validTo),
				},
			});
		},
		SERVICE_NAME,
		"getMonitorCertificate"
	);

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
	getMonitorById = asyncHandler(
		async (req, res, next) => {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await getMonitorByIdQueryValidation.validateAsync(req.query);

			const monitor = await this.db.getMonitorById(req.params.monitorId);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			if (!monitor.teamId.equals(teamId)) {
				const error = new Error("Unauthorized");
				error.status = 403;
				throw error;
			}

			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data: monitor,
			});
		},
		SERVICE_NAME,
		"getMonitorById"
	);

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
	createMonitor = asyncHandler(
		async (req, res, next) => {
			await createMonitorBodyValidation.validateAsync(req.body);

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
		},
		SERVICE_NAME,
		"createMonitor"
	);

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
	createBulkMonitors = asyncHandler(
		async (req, res, next) => {
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
					if (errors.length > 0) {
						throw createServerError("Error parsing CSV");
					}

					if (!data || data.length === 0) {
						throw createServerError("CSV file contains no data rows");
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
				},
			});
		},
		SERVICE_NAME,
		"createBulkMonitors"
	);
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
	checkEndpointResolution = asyncHandler(
		async (req, res, next) => {
			await getMonitorURLByQueryValidation.validateAsync(req.query);
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
		},
		SERVICE_NAME,
		"checkEndpointResolution"
	);

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
	deleteMonitor = asyncHandler(
		async (req, res, next) => {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			const monitorId = req.params.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			await this.verifyTeamAccess(teamId, monitorId);

			const monitor = await this.db.deleteMonitor({ monitorId });
			await this.jobQueue.deleteJob(monitor);
			await this.db.deleteStatusPagesByMonitorId(monitor._id);
			return res.success({ msg: this.stringService.monitorDelete });
		},
		SERVICE_NAME,
		"deleteMonitor"
	);

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
	deleteAllMonitors = asyncHandler(
		async (req, res, next) => {
			const teamId = req?.user?.teamId;
			const { monitors, deletedCount } = await this.db.deleteAllMonitors(teamId);
			await Promise.all(
				monitors.map(async (monitor) => {
					try {
						await this.jobQueue.deleteJob(monitor);
						await this.db.deleteChecks(monitor._id);
						await this.db.deletePageSpeedChecksByMonitorId(monitor._id);
						await this.db.deleteNotificationsByMonitorId(monitor._id);
					} catch (error) {
						logger.warn({
							message: `Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`,
							service: SERVICE_NAME,
							method: "deleteAllMonitors",
							stack: error.stack,
						});
					}
				})
			);
			return res.success({ msg: `Deleted ${deletedCount} monitors` });
		},
		SERVICE_NAME,
		"deleteAllMonitors"
	);

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
	editMonitor = asyncHandler(
		async (req, res, next) => {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await editMonitorBodyValidation.validateAsync(req.body);
			const monitorId = req?.params?.monitorId;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			await this.verifyTeamAccess(teamId, monitorId);

			const editedMonitor = await this.db.editMonitor(monitorId, req.body);

			await this.jobQueue.updateJob(editedMonitor);

			return res.success({
				msg: this.stringService.monitorEdit,
				data: editedMonitor,
			});
		},
		SERVICE_NAME,
		"editMonitor"
	);

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
	pauseMonitor = asyncHandler(
		async (req, res, next) => {
			await pauseMonitorParamValidation.validateAsync(req.params);

			const monitorId = req.params.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			await this.verifyTeamAccess(teamId, monitorId);

			const monitor = await this.db.pauseMonitor({ monitorId });
			monitor.isActive === true ? await this.jobQueue.resumeJob(monitor._id, monitor) : await this.jobQueue.pauseJob(monitor);

			return res.success({
				msg: monitor.isActive ? this.stringService.monitorResume : this.stringService.monitorPause,
				data: monitor,
			});
		},
		SERVICE_NAME,
		"pauseMonitor"
	);

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
	addDemoMonitors = asyncHandler(
		async (req, res, next) => {
			const { _id, teamId } = req.user;
			const demoMonitors = await this.db.addDemoMonitors(_id, teamId);
			await Promise.all(demoMonitors.map((monitor) => this.jobQueue.addJob(monitor._id, monitor)));

			return res.success({
				msg: this.stringService.monitorDemoAdded,
				data: demoMonitors.length,
			});
		},
		SERVICE_NAME,
		"addDemoMonitors"
	);

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
	sendTestEmail = asyncHandler(
		async (req, res, next) => {
			const { to } = req.body;
			if (!to || typeof to !== "string") {
				throw new Error(this.stringService.errorForValidEmailAddress);
			}

			const subject = this.stringService.testEmailSubject;
			const context = { testName: "Monitoring System" };

			const html = await this.emailService.buildEmail("testEmailTemplate", context);
			const messageId = await this.emailService.sendEmail(to, subject, html);

			if (!messageId) {
				throw createServerError("Failed to send test email.");
			}

			return res.success({
				msg: this.stringService.sendTestEmail,
				data: { messageId },
			});
		},
		SERVICE_NAME,
		"sendTestEmail"
	);

	getMonitorsByTeamId = asyncHandler(
		async (req, res, next) => {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);

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
		},
		SERVICE_NAME,
		"getMonitorsByTeamId"
	);

	getMonitorsAndSummaryByTeamId = asyncHandler(
		async (req, res, next) => {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);

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
		},
		SERVICE_NAME,
		"getMonitorsAndSummaryByTeamId"
	);

	getMonitorsWithChecksByTeamId = asyncHandler(
		async (req, res, next) => {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);

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
				msg: "OK",
				data: result,
			});
		},
		SERVICE_NAME,
		"getMonitorsWithChecksByTeamId"
	);

	seedDb = asyncHandler(
		async (req, res, next) => {
			const { _id, teamId } = req.user;
			await seedDb(_id, teamId);
			res.success({ msg: "Database seeded" });
		},
		SERVICE_NAME,
		"seedDb"
	);

	exportMonitorsToCSV = asyncHandler(
		async (req, res, next) => {
			const { teamId } = req.user;

			const monitors = await this.db.getMonitorsByTeamId({ teamId });
			if (!monitors || monitors.length === 0) {
				return res.success({
					msg: this.stringService.noMonitorsFound,
					data: null,
				});
			}
			const csvData = monitors?.filteredMonitors?.map((monitor) => ({
				name: monitor.name,
				description: monitor.description,
				type: monitor.type,
				url: monitor.url,
				interval: monitor.interval,
				port: monitor.port,
				ignoreTlsErrors: monitor.ignoreTlsErrors,
				isActive: monitor.isActive,
			}));

			const csv = pkg.unparse(csvData);

			return res.file({
				data: csv,
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": "attachment; filename=monitors.csv",
				},
			});
		},
		SERVICE_NAME,
		"exportMonitorsToCSV"
	);
}

export default MonitorController;
