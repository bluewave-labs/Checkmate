import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError.js";
import {
	createMaintenanceWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	deleteMaintenanceWindowByIdParamValidation,
} from "@/validation/joi.js";

const SERVICE_NAME = "maintenanceWindowController";

class MaintenanceWindowController {
	static SERVICE_NAME = SERVICE_NAME;
	private maintenanceWindowService: any;
	constructor(maintenanceWindowService: any) {
		this.maintenanceWindowService = maintenanceWindowService;
	}

	get serviceName() {
		return MaintenanceWindowController.SERVICE_NAME;
	}

	createMaintenanceWindows = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createMaintenanceWindowBodyValidation.validateAsync(req.body);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

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
			await getMaintenanceWindowByIdParamValidation.validateAsync(req.params);

			const teamId = req.user.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const maintenanceWindow = await this.maintenanceWindowService.getMaintenanceWindowById({ id: req.params.id, teamId });

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
			await getMaintenanceWindowsByTeamIdQueryValidation.validateAsync(req.query);

			const teamId = req?.user?.teamId;

			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const maintenanceWindows = await this.maintenanceWindowService.getMaintenanceWindowsByTeamId({ teamId, query: req.query });

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
			await getMaintenanceWindowsByMonitorIdParamValidation.validateAsync(req.params);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const maintenanceWindows = await this.maintenanceWindowService.getMaintenanceWindowsByMonitorId({ monitorId: req.params.monitorId, teamId });

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
			await deleteMaintenanceWindowByIdParamValidation.validateAsync(req.params);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			await this.maintenanceWindowService.deleteMaintenanceWindow({ id: req.params.id, teamId });

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
			await editMaintenanceWindowByIdParamValidation.validateAsync(req.params);
			await editMaintenanceByIdWindowBodyValidation.validateAsync(req.body);

			const teamId = req.user.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const editedMaintenanceWindow = await this.maintenanceWindowService.editMaintenanceWindow({ id: req.params.id, body: req.body, teamId });
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
