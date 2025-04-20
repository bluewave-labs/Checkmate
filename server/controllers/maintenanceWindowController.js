import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	deleteMaintenanceWindowByIdParamValidation,
} from "../validation/joi.js";
import jwt from "jsonwebtoken";
import { getTokenFromHeaders } from "../utils/utils.js";
import { handleValidationError, handleError } from "./controllerUtils.js";

const SERVICE_NAME = "maintenanceWindowController";

class MaintenanceWindowController {
	constructor(db, settingsService, stringService) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
	}

	createMaintenanceWindows = async (req, res, next) => {
		try {
			await createMaintenanceWindowBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}
		try {
			const token = getTokenFromHeaders(req.headers);
			const { jwtSecret } = this.settingsService.getSettings();
			const { teamId } = jwt.verify(token, jwtSecret);
			const monitorIds = req.body.monitors;
			const dbTransactions = monitorIds.map((monitorId) => {
				return this.db.createMaintenanceWindow({
					teamId,
					monitorId,
					name: req.body.name,
					active: req.body.active ? req.body.active : true,
					repeat: req.body.repeat,
					start: req.body.start,
					end: req.body.end,
				});
			});
			await Promise.all(dbTransactions);

			return res.success({
				msg: this.stringService.maintenanceWindowCreate,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "createMaintenanceWindow"));
		}
	};

	getMaintenanceWindowById = async (req, res, next) => {
		try {
			await getMaintenanceWindowByIdParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}
		try {
			const maintenanceWindow = await this.db.getMaintenanceWindowById(req.params.id);

			return res.success({
				msg: this.stringService.maintenanceWindowGetById,
				data: maintenanceWindow,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMaintenanceWindowById"));
		}
	};

	getMaintenanceWindowsByTeamId = async (req, res, next) => {
		try {
			await getMaintenanceWindowsByTeamIdQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const token = getTokenFromHeaders(req.headers);
			const { jwtSecret } = this.settingsService.getSettings();
			const { teamId } = jwt.verify(token, jwtSecret);
			const maintenanceWindows = await this.db.getMaintenanceWindowsByTeamId(
				teamId,
				req.query
			);

			return res.success({
				msg: this.stringService.maintenanceWindowGetByTeam,
				data: maintenanceWindows,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMaintenanceWindowsByUserId"));
		}
	};

	getMaintenanceWindowsByMonitorId = async (req, res, next) => {
		try {
			await getMaintenanceWindowsByMonitorIdParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const maintenanceWindows = await this.db.getMaintenanceWindowsByMonitorId(
				req.params.monitorId
			);

			return res.success({
				msg: this.stringService.maintenanceWindowGetByUser,
				data: maintenanceWindows,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMaintenanceWindowsByMonitorId"));
		}
	};

	deleteMaintenanceWindow = async (req, res, next) => {
		try {
			await deleteMaintenanceWindowByIdParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}
		try {
			await this.db.deleteMaintenanceWindowById(req.params.id);
			return res.success({
				msg: this.stringService.maintenanceWindowDelete,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteMaintenanceWindow"));
		}
	};

	editMaintenanceWindow = async (req, res, next) => {
		try {
			await editMaintenanceWindowByIdParamValidation.validateAsync(req.params);
			await editMaintenanceByIdWindowBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}
		try {
			const editedMaintenanceWindow = await this.db.editMaintenanceWindowById(
				req.params.id,
				req.body
			);
			return res.success({
				msg: this.stringService.maintenanceWindowEdit,
				data: editedMaintenanceWindow,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "editMaintenanceWindow"));
		}
	};
}

export default MaintenanceWindowController;
