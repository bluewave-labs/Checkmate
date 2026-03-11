import { Request, Response, NextFunction } from "express";
import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	deleteMaintenanceWindowByIdParamValidation,
} from "@/validation/maintenanceWindowValidation.js";
import { requireTeamId } from "@/controllers/controllerUtils.js";
import { IMaintenanceWindowService } from "@/service/index.js";

class MaintenanceWindowController {
	private maintenanceWindowService: IMaintenanceWindowService;
	constructor(maintenanceWindowService: IMaintenanceWindowService) {
		this.maintenanceWindowService = maintenanceWindowService;
	}

	createMaintenanceWindows = async (req: Request, res: Response, next: NextFunction) => {
		try {
			createMaintenanceWindowBodyValidation.parse(req.body);
			const teamId = requireTeamId(req?.user?.teamId);
			await this.maintenanceWindowService.createMaintenanceWindow({ teamId, body: req.body });

			return res.status(200).json({
				success: true,
				msg: "Maintenance window created successfully",
			});
		} catch (error) {
			next(error);
		}
	};
	getMaintenanceWindowById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			getMaintenanceWindowByIdParamValidation.parse(req.params);

			const teamId = requireTeamId(req.user?.teamId);

			const maintenanceWindow = await this.maintenanceWindowService.getMaintenanceWindowById({ id: req.params.id as string, teamId });

			return res.status(200).json({
				success: true,
				msg: "Maintenance window fetched successfully",
				data: maintenanceWindow,
			});
		} catch (error) {
			next(error);
		}
	};

	getMaintenanceWindowsByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
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
		} catch (error) {
			next(error);
		}
	};

	getMaintenanceWindowsByMonitorId = async (req: Request, res: Response, next: NextFunction) => {
		try {
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
		} catch (error) {
			next(error);
		}
	};
	deleteMaintenanceWindow = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = deleteMaintenanceWindowByIdParamValidation.parse(req.params);

			const teamId = requireTeamId(req?.user?.teamId);

			await this.maintenanceWindowService.deleteMaintenanceWindow({ id: validatedParams.id, teamId });

			return res.status(200).json({
				success: true,
				msg: "Maintenance window deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	editMaintenanceWindow = async (req: Request, res: Response, next: NextFunction) => {
		try {
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
		} catch (error) {
			next(error);
		}
	};
}

export default MaintenanceWindowController;
