import {
	getMonitorByIdParamValidation,
	getMonitorByIdQueryValidation,
	getMonitorsByTeamIdParamValidation,
	getMonitorsByTeamIdQueryValidation,
	createMonitorBodyValidation,
	editMonitorBodyValidation,
	pauseMonitorParamValidation,
	getMonitorStatsByIdParamValidation,
	getMonitorStatsByIdQueryValidation,
	getCertificateParamValidation,
	getHardwareDetailsByIdParamValidation,
	getHardwareDetailsByIdQueryValidation,
} from "../validation/joi.js";
import sslChecker from "ssl-checker";
import { asyncHandler } from "../utils/errorUtils.js";
import { fetchMonitorCertificate } from "./controllerUtils.js";

const SERVICE_NAME = "monitorController";
class MonitorController {
	constructor({ db, settingsService, jobQueue, stringService, emailService, monitorService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.emailService = emailService;
		this.monitorService = monitorService;
	}

	async verifyTeamAccess(teamId, monitorId) {
		const monitor = await this.db.getMonitorById(monitorId);
		if (!monitor.teamId.equals(teamId)) {
			const error = new Error("Unauthorized");
			error.status = 403;
			throw error;
		}
	}

	getAllMonitors = asyncHandler(
		async (req, res) => {
			const monitors = await this.monitorService.getAllMonitors();
			return res.success({
				msg: this.stringService.monitorGetAll,
				data: monitors,
			});
		},
		SERVICE_NAME,
		"getAllMonitors"
	);

	getUptimeDetailsById = asyncHandler(
		async (req, res) => {
			const monitorId = req?.params?.monitorId;
			const dateRange = req?.query?.dateRange;
			const normalize = req?.query?.normalize;

			const teamId = req?.user?.teamId;

			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const data = await this.monitorService.getUptimeDetailsById({
				teamId,
				monitorId,
				dateRange,
				normalize,
			});
			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data: data,
			});
		},
		SERVICE_NAME,
		"getUptimeDetailsById"
	);

	getMonitorStatsById = asyncHandler(
		async (req, res) => {
			await getMonitorStatsByIdParamValidation.validateAsync(req.params);
			await getMonitorStatsByIdQueryValidation.validateAsync(req.query);

			let { limit, sortOrder, dateRange, numToDisplay, normalize } = req.query;
			const monitorId = req?.params?.monitorId;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const monitorStats = await this.monitorService.getMonitorStatsById({
				teamId,
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
		async (req, res) => {
			await getHardwareDetailsByIdParamValidation.validateAsync(req.params);
			await getHardwareDetailsByIdQueryValidation.validateAsync(req.query);

			const monitorId = req?.params?.monitorId;
			const dateRange = req?.query?.dateRange;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const monitor = await this.monitorService.getHardwareDetailsById({
				teamId,
				monitorId,
				dateRange,
			});

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

	getMonitorById = asyncHandler(
		async (req, res) => {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await getMonitorByIdQueryValidation.validateAsync(req.query);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const monitor = await this.monitorService.getMonitorById({ teamId, monitorId: req?.params?.monitorId });

			return res.success({
				msg: this.stringService.monitorGetByIdSuccess,
				data: monitor,
			});
		},
		SERVICE_NAME,
		"getMonitorById"
	);

	createMonitor = asyncHandler(
		async (req, res) => {
			await createMonitorBodyValidation.validateAsync(req.body);

			const userId = req?.user?._id;
			const teamId = req?.user?.teamId;

			const monitor = await this.monitorService.createMonitor({ teamId, userId, body: req.body });

			return res.success({
				msg: this.stringService.monitorCreate,
				data: monitor,
			});
		},
		SERVICE_NAME,
		"createMonitor"
	);

	createBulkMonitors = asyncHandler(
		async (req, res) => {
			if (!req.file) {
				throw new Error("No file uploaded");
			}

			if (!req.file.mimetype.includes("csv")) {
				throw new Error("File is not a CSV");
			}

			if (req.file.size === 0) {
				throw new Error("File is empty");
			}

			const userId = req?.user?._id;
			const teamId = req?.user?.teamId;

			if (!userId || !teamId) {
				throw new Error("Missing userId or teamId");
			}

			const fileData = req?.file?.buffer?.toString("utf-8");
			if (!fileData) {
				throw new Error("Cannot get file from buffer");
			}

			const monitors = await this.monitorService.createBulkMonitors({ fileData, userId, teamId });

			return res.success({
				msg: this.stringService.bulkMonitorsCreate,
				data: monitors,
			});
		},
		SERVICE_NAME,
		"createBulkMonitors"
	);

	deleteMonitor = asyncHandler(
		async (req, res) => {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			const monitorId = req.params.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const deletedMonitor = await this.monitorService.deleteMonitor({ teamId, monitorId });

			return res.success({ msg: this.stringService.monitorDelete, data: deletedMonitor });
		},
		SERVICE_NAME,
		"deleteMonitor"
	);

	deleteAllMonitors = asyncHandler(
		async (req, res) => {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const deletedCount = await this.monitorService.deleteAllMonitors({ teamId });

			return res.success({ msg: `Deleted ${deletedCount} monitors` });
		},
		SERVICE_NAME,
		"deleteAllMonitors"
	);

	editMonitor = asyncHandler(
		async (req, res) => {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await editMonitorBodyValidation.validateAsync(req.body);
			const monitorId = req?.params?.monitorId;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const editedMonitor = await this.monitorService.editMonitor({ teamId, monitorId, body: req.body });

			return res.success({
				msg: this.stringService.monitorEdit,
				data: editedMonitor,
			});
		},
		SERVICE_NAME,
		"editMonitor"
	);

	pauseMonitor = asyncHandler(
		async (req, res) => {
			await pauseMonitorParamValidation.validateAsync(req.params);

			const monitorId = req.params.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const monitor = await this.monitorService.pauseMonitor({ teamId, monitorId });

			return res.success({
				msg: monitor.isActive ? this.stringService.monitorResume : this.stringService.monitorPause,
				data: monitor,
			});
		},
		SERVICE_NAME,
		"pauseMonitor"
	);

	addDemoMonitors = asyncHandler(
		async (req, res) => {
			const { _id, teamId } = req.user;
			const demoMonitors = await this.monitorService.addDemoMonitors({ userId: _id, teamId });

			return res.success({
				msg: this.stringService.monitorDemoAdded,
				data: demoMonitors?.length ?? 0,
			});
		},
		SERVICE_NAME,
		"addDemoMonitors"
	);

	sendTestEmail = asyncHandler(
		async (req, res) => {
			const { to } = req.body;
			if (!to || typeof to !== "string") {
				throw new Error(this.stringService.errorForValidEmailAddress);
			}

			const messageId = await this.monitorService.sendTestEmail({ to });
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
			const teamId = req?.user?.teamId;

			const monitors = await this.monitorService.getMonitorsByTeamId({ teamId, limit, type, page, rowsPerPage, filter, field, order });

			return res.success({
				msg: this.stringService.monitorGetByTeamId,
				data: monitors,
			});
		},
		SERVICE_NAME,
		"getMonitorsByTeamId"
	);

	getMonitorsAndSummaryByTeamId = asyncHandler(
		async (req, res) => {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);

			const explain = req?.query?.explain;
			const type = req?.query?.type;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const result = await this.monitorService.getMonitorsAndSummaryByTeamId({ teamId, type, explain });

			return res.success({
				msg: "OK", // TODO
				data: result,
			});
		},
		SERVICE_NAME,
		"getMonitorsAndSummaryByTeamId"
	);

	getMonitorsWithChecksByTeamId = asyncHandler(
		async (req, res) => {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);

			const explain = req?.query?.explain;
			let { limit, type, page, rowsPerPage, filter, field, order } = req.query;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const monitors = await this.monitorService.getMonitorsWithChecksByTeamId({
				teamId,
				limit,
				type,
				page,
				rowsPerPage,
				filter,
				field,
				order,
				explain,
			});

			return res.success({
				msg: "OK",
				data: monitors,
			});
		},
		SERVICE_NAME,
		"getMonitorsWithChecksByTeamId"
	);

	exportMonitorsToCSV = asyncHandler(
		async (req, res) => {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const csv = await this.monitorService.exportMonitorsToCSV({ teamId });

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
