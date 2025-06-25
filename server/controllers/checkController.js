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
} from "../validation/joi.js";
import jwt from "jsonwebtoken";
import { getTokenFromHeaders } from "../utils/utils.js";
import { handleValidationError, handleError } from "./controllerUtils.js";

const SERVICE_NAME = "checkController";

class CheckController {
	constructor(db, settingsService, stringService) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
	}

	createCheck = async (req, res, next) => {
		try {
			await createCheckParamValidation.validateAsync(req.params);
			await createCheckBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const checkData = { ...req.body };
			const check = await this.db.createCheck(checkData);

			return res.success({
				msg: this.stringService.checkCreate,
				data: check,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "createCheck"));
		}
	};

	getChecksByMonitor = async (req, res, next) => {
		try {
			await getChecksParamValidation.validateAsync(req.params);
			await getChecksQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const { monitorId } = req.params;
			let { type, sortOrder, dateRange, filter, page, rowsPerPage, status } = req.query;
			const result = await this.db.getChecksByMonitor({
				monitorId,
				type,
				sortOrder,
				dateRange,
				filter,
				page,
				rowsPerPage,
				status,
			});

			return res.success({
				msg: this.stringService.checkGet,
				data: result,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getChecks"));
		}
	};

	getChecksByTeam = async (req, res, next) => {
		try {
			await getTeamChecksParamValidation.validateAsync(req.params);
			await getTeamChecksQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}
		try {
			let { sortOrder, dateRange, filter, page, rowsPerPage } = req.query;
			const { teamId } = req.user;

			const checkData = await this.db.getChecksByTeam({
				sortOrder,
				dateRange,
				filter,
				page,
				rowsPerPage,
				teamId,
			});
			return res.success({
				msg: this.stringService.checkGet,
				data: checkData,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getTeamChecks"));
		}
	};

	deleteChecks = async (req, res, next) => {
		try {
			await deleteChecksParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const deletedCount = await this.db.deleteChecks(req.params.monitorId);

			return res.success({
				msg: this.stringService.checkDelete,
				data: { deletedCount },
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteChecks"));
		}
	};

	deleteChecksByTeamId = async (req, res, next) => {
		try {
			await deleteChecksByTeamIdParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const { teamId } = req.user;
			const deletedCount = await this.db.deleteChecksByTeamId(teamId);

			return res.success({
				msg: this.stringService.checkDelete,
				data: { deletedCount },
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteChecksByTeamId"));
		}
	};

	updateChecksTTL = async (req, res, next) => {
		const SECONDS_PER_DAY = 86400;

		try {
			await updateChecksTTLBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			// Get user's teamId
			const { teamId } = req.user;
			const ttl = parseInt(req.body.ttl, 10) * SECONDS_PER_DAY;
			await this.db.updateChecksTTL(teamId, ttl);

			return res.success({
				msg: this.stringService.checkUpdateTTL,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "updateTTL"));
		}
	};
}
export default CheckController;
