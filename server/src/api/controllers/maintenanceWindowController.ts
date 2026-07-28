import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	deleteMaintenanceWindowByIdParamValidation,
} from "@/api/validation/maintenanceWindowValidation.js";
import { requireTeamId } from "@/api/controllers/controllerUtils.js";
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

	createMaintenanceWindows = catchAsync(async (req: Request, res: Response) => {
		const validatedBody = createMaintenanceWindowBodyValidation.parse(req.body);
		const teamId = requireTeamId(req?.user?.teamId);

		const monitorIDs = validatedBody.monitors;
		const name = validatedBody.name;
		const active = validatedBody.active ?? true;
		const duration = validatedBody.duration;
		const durationUnit = validatedBody.durationUnit;
		const repeat = validatedBody.repeat;
		const start = validatedBody.start;
		const end = validatedBody.end;

		await this.maintenanceWindowService.createMaintenanceWindow({ teamId, monitorIDs, name, active, duration, durationUnit, repeat, start, end });

		return res.status(200).json({
			success: true,
			msg: "Maintenance window created successfully",
		});
	});
	getMaintenanceWindowById = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = getMaintenanceWindowByIdParamValidation.parse(req.params);

		const teamId = requireTeamId(req.user?.teamId);

		const maintenanceWindow = await this.maintenanceWindowService.getMaintenanceWindowById({ id: validatedParams.id, teamId });

		return res.status(200).json({
			success: true,
			msg: "Maintenance window fetched successfully",
			data: maintenanceWindow,
		});
	});

	getMaintenanceWindowsByTeamId = catchAsync(async (req: Request, res: Response) => {
		const validatedQuery = getMaintenanceWindowsByTeamIdQueryValidation.parse(req.query);

		const teamId = requireTeamId(req?.user?.teamId);

		const maintenanceWindows = await this.maintenanceWindowService.getMaintenanceWindowsByTeamId({
			teamId,
			active: validatedQuery.active,
			page: validatedQuery.page,
			rowsPerPage: validatedQuery.rowsPerPage,
			field: validatedQuery.field,
			order: validatedQuery.order,
		});

		return res.status(200).json({
			success: true,
			msg: "Maintenance windows fetched successfully",
			data: maintenanceWindows,
		});
	});

	getMaintenanceWindowsByMonitorId = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = getMaintenanceWindowsByMonitorIdParamValidation.parse(req.params);

		const teamId = requireTeamId(req?.user?.teamId);

		const maintenanceWindows = await this.maintenanceWindowService.getMaintenanceWindowsByMonitorId({
			monitorId: validatedParams.monitorId,
			teamId,
		});

		return res.status(200).json({
			success: true,
			msg: "Maintenance windows fetched successfully",
			data: maintenanceWindows,
		});
	});
	deleteMaintenanceWindow = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = deleteMaintenanceWindowByIdParamValidation.parse(req.params);

		const teamId = requireTeamId(req?.user?.teamId);

		await this.maintenanceWindowService.deleteMaintenanceWindow({ id: validatedParams.id, teamId });

		return res.status(200).json({
			success: true,
			msg: "Maintenance window deleted successfully",
		});
	});

	editMaintenanceWindow = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = editMaintenanceWindowByIdParamValidation.parse(req.params);
		const validatedBody = editMaintenanceByIdWindowBodyValidation.parse(req.body);

		const teamId = requireTeamId(req.user?.teamId);

		const editedMaintenanceWindow = await this.maintenanceWindowService.editMaintenanceWindow({
			id: validatedParams.id,
			body: validatedBody,
			teamId,
		});
		return res.status(200).json({
			success: true,
			msg: "Maintenance window edited successfully",
			data: editedMaintenanceWindow,
		});
	});
}

export default MaintenanceWindowController;
