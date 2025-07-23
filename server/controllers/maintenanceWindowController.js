import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	deleteMaintenanceWindowByIdParamValidation,
} from "../validation/joi.js";
import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "maintenanceWindowController";

class MaintenanceWindowController {
	constructor(db, settingsService, stringService) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
	}

	createMaintenanceWindows = asyncHandler(
		async (req, res, next) => {
			await createMaintenanceWindowBodyValidation.validateAsync(req.body);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const monitorIds = req.body.monitors;

			const monitors = await this.db.getMonitorsByIds(monitorIds);

			const unauthorizedMonitors = monitors.filter((monitor) => !monitor.teamId.equals(teamId));

			if (unauthorizedMonitors.length > 0) {
				const error = new Error("Unauthorized access to one or more monitors");
				error.status = 403;
				error.service = SERVICE_NAME;
				error.method = "createMaintenanceWindows";
				throw error;
			}

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
		},
		SERVICE_NAME,
		"createMaintenanceWindows"
	);

	getMaintenanceWindowById = asyncHandler(
		async (req, res, next) => {
			await getMaintenanceWindowByIdParamValidation.validateAsync(req.params);

			const teamId = req.user.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const maintenanceWindow = await this.db.getMaintenanceWindowById({ id: req.params.id, teamId });
			return res.success({
				msg: this.stringService.maintenanceWindowGetById,
				data: maintenanceWindow,
			});
		},
		SERVICE_NAME,
		"getMaintenanceWindowById"
	);

	getMaintenanceWindowsByTeamId = asyncHandler(
		async (req, res, next) => {
			await getMaintenanceWindowsByTeamIdQueryValidation.validateAsync(req.query);

			const teamId = req?.user?.teamId;

			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const maintenanceWindows = await this.db.getMaintenanceWindowsByTeamId(teamId, req.query);

			return res.success({
				msg: this.stringService.maintenanceWindowGetByTeam,
				data: maintenanceWindows,
			});
		},
		SERVICE_NAME,
		"getMaintenanceWindowsByTeamId"
	);

	getMaintenanceWindowsByMonitorId = asyncHandler(
		async (req, res, next) => {
			await getMaintenanceWindowsByMonitorIdParamValidation.validateAsync(req.params);

			const monitorId = req.params.monitorId;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const maintenanceWindows = await this.db.getMaintenanceWindowsByMonitorId({ monitorId, teamId });

			return res.success({
				msg: this.stringService.maintenanceWindowGetByUser,
				data: maintenanceWindows,
			});
		},
		SERVICE_NAME,
		"getMaintenanceWindowsByMonitorId"
	);

	deleteMaintenanceWindow = asyncHandler(
		async (req, res, next) => {
			await deleteMaintenanceWindowByIdParamValidation.validateAsync(req.params);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			await this.db.deleteMaintenanceWindowById({ id: req.params.id, teamId });
			return res.success({
				msg: this.stringService.maintenanceWindowDelete,
			});
		},
		SERVICE_NAME,
		"deleteMaintenanceWindow"
	);

	editMaintenanceWindow = asyncHandler(
		async (req, res, next) => {
			await editMaintenanceWindowByIdParamValidation.validateAsync(req.params);
			await editMaintenanceByIdWindowBodyValidation.validateAsync(req.body);

			const teamId = req.user.teamId;
			if (!teamId) {
				throw new Error("Team ID is required");
			}

			const editedMaintenanceWindow = await this.db.editMaintenanceWindowById({ id: req.params.id, body: req.body, teamId });

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
