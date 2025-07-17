import {
	createCheckParamValidation,
	createCheckBodyValidation,
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksParamValidation,
	getTeamChecksQueryValidation,
	deleteChecksParamValidation,
	deleteChecksByTeamIdParamValidation,
	updateChecksTTLBodyValidation,
	ackCheckBodyValidation,
	ackAllChecksParamValidation,
	ackAllChecksBodyValidation,
} from "../validation/joi.js";
import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "checkController";

class CheckController {
	constructor(db, settingsService, stringService) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
	}

	createCheck = asyncHandler(
		async (req, res, next) => {
			await createCheckParamValidation.validateAsync(req.params);
			await createCheckBodyValidation.validateAsync(req.body);

			const checkData = { ...req.body };
			const check = await this.db.createCheck(checkData);

			return res.success({
				msg: this.stringService.checkCreate,
				data: check,
			});
		},
		SERVICE_NAME,
		"createCheck"
	);

	getChecksByMonitor = asyncHandler(
		async (req, res, next) => {
			await getChecksParamValidation.validateAsync(req.params);
			await getChecksQueryValidation.validateAsync(req.query);

			const { monitorId } = req.params;
			let { type, sortOrder, dateRange, filter, ack, page, rowsPerPage, status } =
				req.query;
			const result = await this.db.getChecksByMonitor({
				monitorId,
				type,
				sortOrder,
				dateRange,
				filter,
				ack,
				page,
				rowsPerPage,
				status,
			});

			return res.success({
				msg: this.stringService.checkGet,
				data: result,
			});
		},
		SERVICE_NAME,
		"getChecksByMonitor"
	);

	getChecksByTeam = asyncHandler(
		async (req, res, next) => {
			await getTeamChecksParamValidation.validateAsync(req.params);
			await getTeamChecksQueryValidation.validateAsync(req.query);

			let { sortOrder, dateRange, filter, ack, page, rowsPerPage } = req.query;
			const { teamId } = req.user;

			const checkData = await this.db.getChecksByTeam({
				sortOrder,
				dateRange,
				filter,
				ack,
				page,
				rowsPerPage,
				teamId,
			});
			return res.success({
				msg: this.stringService.checkGet,
				data: checkData,
			});
		},
		SERVICE_NAME,
		"getChecksByTeam"
	);

	getChecksSummaryByTeamId = asyncHandler(
		async (req, res, next) => {
			const { teamId } = req.user;
			const summary = await this.db.getChecksSummaryByTeamId({ teamId });
			return res.success({
				msg: this.stringService.checkGetSummary,
				data: summary,
			});
		},
		SERVICE_NAME,
		"getChecksSummaryByTeamId"
	);

	ackCheck = asyncHandler(
		async (req, res, next) => {
			await ackCheckBodyValidation.validateAsync(req.body);

			const { checkId } = req.params;
			const { ack } = req.body;
			const { teamId } = req.user;

			const updatedCheck = await this.db.ackCheck(checkId, teamId, ack);

			return res.success({
				msg: this.stringService.checkUpdateStatus,
				data: updatedCheck,
			});
		},
		SERVICE_NAME,
		"ackCheck"
	);

	ackAllChecks = asyncHandler(
		async (req, res, next) => {
			await ackAllChecksParamValidation.validateAsync(req.params);
			await ackAllChecksBodyValidation.validateAsync(req.body);

			const { monitorId, path } = req.params;
			const { ack } = req.body;
			const { teamId } = req.user;

			const updatedChecks = await this.db.ackAllChecks(monitorId, teamId, ack, path);

			return res.success({
				msg: this.stringService.checkUpdateStatus,
				data: updatedChecks,
			});
		},
		SERVICE_NAME,
		"ackAllChecks"
	);

	deleteChecks = asyncHandler(
		async (req, res, next) => {
			await deleteChecksParamValidation.validateAsync(req.params);

			const deletedCount = await this.db.deleteChecks(req.params.monitorId);

			return res.success({
				msg: this.stringService.checkDelete,
				data: { deletedCount },
			});
		},
		SERVICE_NAME,
		"deleteChecks"
	);

	deleteChecksByTeamId = asyncHandler(
		async (req, res, next) => {
			await deleteChecksByTeamIdParamValidation.validateAsync(req.params);

			const { teamId } = req.user;
			const deletedCount = await this.db.deleteChecksByTeamId(teamId);

			return res.success({
				msg: this.stringService.checkDelete,
				data: { deletedCount },
			});
		},
		SERVICE_NAME,
		"deleteChecksByTeamId"
	);

	updateChecksTTL = asyncHandler(
		async (req, res, next) => {
			const SECONDS_PER_DAY = 86400;

			await updateChecksTTLBodyValidation.validateAsync(req.body);

			const { teamId } = req.user;
			const ttl = parseInt(req.body.ttl, 10) * SECONDS_PER_DAY;
			await this.db.updateChecksTTL(teamId, ttl);

			return res.success({
				msg: this.stringService.checkUpdateTTL,
			});
		},
		SERVICE_NAME,
		"updateChecksTtl"
	);
}
export default CheckController;
