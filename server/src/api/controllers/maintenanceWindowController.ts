import { RequestHandler } from "express";
import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	deleteMaintenanceWindowByIdParamValidation,
} from "@/api/validation/maintenanceWindowValidation.js";
import { Handler, requireTeamId } from "@/api/controllers/controllerUtils.js";
import { IMaintenanceWindowService } from "@/domain/maintenance-windows/maintenance-window.service.js";

export interface IMaintenanceWindowController {
	createMaintenanceWindows: RequestHandler;
	getMaintenanceWindowById: RequestHandler;
	getMaintenanceWindowsByTeamId: RequestHandler;
	getMaintenanceWindowsByMonitorId: RequestHandler;
	deleteMaintenanceWindow: RequestHandler;
	editMaintenanceWindow: RequestHandler;
}
class MaintenanceWindowController implements IMaintenanceWindowController {
	private maintenanceWindowService: IMaintenanceWindowService;
	constructor(maintenanceWindowService: IMaintenanceWindowService) {
		this.maintenanceWindowService = maintenanceWindowService;
	}

	createMaintenanceWindows: Handler = async (req, res) => {
		const { monitors: monitorIDs, name, active, duration, durationUnit, repeat, start, end } = createMaintenanceWindowBodyValidation.parse(req.body);
		const teamId = requireTeamId(req?.user?.teamId);
		await this.maintenanceWindowService.createMaintenanceWindow({ teamId, monitorIDs, name, active, duration, durationUnit, repeat, start, end });
		res.json({ success: true, msg: "Maintenance window created successfully" });
	};

	getMaintenanceWindowById: Handler = async (req, res) => {
		const validatedParams = getMaintenanceWindowByIdParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.maintenanceWindowService.getMaintenanceWindowById({ id: validatedParams.id, teamId });
		res.json({ success: true, msg: "Maintenance window fetched successfully", data });
	};

	getMaintenanceWindowsByTeamId: Handler = async (req, res) => {
		const { active, page, rowsPerPage, field, order } = getMaintenanceWindowsByTeamIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req?.user?.teamId);
		const data = await this.maintenanceWindowService.getMaintenanceWindowsByTeamId({ teamId, active, page, rowsPerPage, field, order });
		res.json({ success: true, msg: "Maintenance windows fetched successfully", data });
	};

	getMaintenanceWindowsByMonitorId: Handler = async (req, res) => {
		const { monitorId } = getMaintenanceWindowsByMonitorIdParamValidation.parse(req.params);
		const teamId = requireTeamId(req?.user?.teamId);
		const data = await this.maintenanceWindowService.getMaintenanceWindowsByMonitorId({ monitorId, teamId });
		res.json({ success: true, msg: "Maintenance windows fetched successfully", data });
	};

	deleteMaintenanceWindow: Handler = async (req, res) => {
		const { id } = deleteMaintenanceWindowByIdParamValidation.parse(req.params);
		const teamId = requireTeamId(req?.user?.teamId);
		await this.maintenanceWindowService.deleteMaintenanceWindow({ id, teamId });
		res.json({ success: true, msg: "Maintenance window deleted successfully" });
	};

	editMaintenanceWindow: Handler = async (req, res) => {
		const { id } = editMaintenanceWindowByIdParamValidation.parse(req.params);
		const body = editMaintenanceByIdWindowBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.maintenanceWindowService.editMaintenanceWindow({ id, body, teamId });
		res.json({ success: true, msg: "Maintenance window edited successfully", data });
	};
}

export default MaintenanceWindowController;
