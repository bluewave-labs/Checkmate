import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	deleteMaintenanceWindowByIdParamValidation,
} from "../validation/joi.js";
import BaseController from "./baseController.js";

const SERVICE_NAME = "maintenanceWindowController";

class MaintenanceWindowController extends BaseController {
	constructor(commonDependencies, { settingsService, maintenanceWindowService }) {
		super(commonDependencies);
		this.settingsService = settingsService;
		this.maintenanceWindowService = maintenanceWindowService;
	}

	createMaintenanceWindows = this.asyncHandler(
		async (req, res) => {
			await createMaintenanceWindowBodyValidation.validateAsync(req.body);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			await this.maintenanceWindowService.createMaintenanceWindow({ teamId, body: req.body });

			return res.success({
				msg: this.stringService.maintenanceWindowCreate,
			});
		},
		SERVICE_NAME,
		"createMaintenanceWindows"
	);

	getMaintenanceWindowById = this.asyncHandler(
		async (req, res) => {
			await getMaintenanceWindowByIdParamValidation.validateAsync(req.params);

			const teamId = req.user.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const maintenanceWindow = await this.maintenanceWindowService.getMaintenanceWindowById({ id: req.params.id, teamId });

			return res.success({
				msg: this.stringService.maintenanceWindowGetById,
				data: maintenanceWindow,
			});
		},
		SERVICE_NAME,
		"getMaintenanceWindowById"
	);

	getMaintenanceWindowsByTeamId = this.asyncHandler(
		async (req, res) => {
			await getMaintenanceWindowsByTeamIdQueryValidation.validateAsync(req.query);

			const teamId = req?.user?.teamId;

			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const maintenanceWindows = await this.maintenanceWindowService.getMaintenanceWindowsByTeamId({ teamId, query: req.query });

			return res.success({
				msg: this.stringService.maintenanceWindowGetByTeam,
				data: maintenanceWindows,
			});
		},
		SERVICE_NAME,
		"getMaintenanceWindowsByTeamId"
	);

	getMaintenanceWindowsByMonitorId = this.asyncHandler(
		async (req, res) => {
			await getMaintenanceWindowsByMonitorIdParamValidation.validateAsync(req.params);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const maintenanceWindows = await this.maintenanceWindowService.getMaintenanceWindowsByMonitorId({ monitorId: req.params.monitorId, teamId });

			return res.success({
				msg: this.stringService.maintenanceWindowGetByUser,
				data: maintenanceWindows,
			});
		},
		SERVICE_NAME,
		"getMaintenanceWindowsByMonitorId"
	);

	deleteMaintenanceWindow = this.asyncHandler(
		async (req, res) => {
			await deleteMaintenanceWindowByIdParamValidation.validateAsync(req.params);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			await this.maintenanceWindowService.deleteMaintenanceWindow({ id: req.params.id, teamId });

			return res.success({
				msg: this.stringService.maintenanceWindowDelete,
			});
		},
		SERVICE_NAME,
		"deleteMaintenanceWindow"
	);

	editMaintenanceWindow = this.asyncHandler(
		async (req, res) => {
			await editMaintenanceWindowByIdParamValidation.validateAsync(req.params);
			await editMaintenanceByIdWindowBodyValidation.validateAsync(req.body);

			const teamId = req.user.teamId;
			if (!teamId) {
				throw this.errorService.createBadRequestError("Team ID is required");
			}

			const editedMaintenanceWindow = await this.maintenanceWindowService.editMaintenanceWindow({ id: req.params.id, body: req.body, teamId });
			return res.success({
				msg: this.stringService.maintenanceWindowEdit,
				data: editedMaintenanceWindow,
			});
		},
		SERVICE_NAME,
		"editMaintenanceWindow"
	);
}

export default MaintenanceWindowController;
