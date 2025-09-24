import { Request, Response, NextFunction } from "express";
import MaintenanceService from "../../service/v2/business/MaintenanceService.js";

class MaintenanceController {
	private maintenanceService: MaintenanceService;
	constructor(maintenanceService: MaintenanceService) {
		this.maintenanceService = maintenanceService;
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}
			const maintenance = await this.maintenanceService.create(tokenizedUser, req.body);
			res.status(201).json({ message: "OK", data: maintenance });
		} catch (error) {
			next(error);
		}
	};

	getAll = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const maintenances = await this.maintenanceService.getAll();
			res.status(200).json({
				message: "OK",
				data: maintenances,
			});
		} catch (error) {
			next(error);
		}
	};

	toggleActive = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}
			const id = req.params.id;
			if (!id) {
				return res.status(400).json({ message: "ID parameter is required" });
			}
			const maintenance = await this.maintenanceService.toggleActive(tokenizedUser, id);
			res.status(200).json({ message: "OK", data: maintenance });
		} catch (error) {
			next(error);
		}
	};

	update = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}
			const id = req.params.id;
			if (!id) {
				return res.status(400).json({ message: "ID parameter is required" });
			}
			const updatedMaintenance = await this.maintenanceService.update(tokenizedUser, id, req.body);
			res.status(200).json({ message: "OK", data: updatedMaintenance });
		} catch (error) {
			next(error);
		}
	};

	get = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const id = req.params.id;
			if (!id) {
				return res.status(400).json({ message: "ID parameter is required" });
			}
			const maintenance = await this.maintenanceService.get(id);
			res.status(200).json({ message: "OK", data: maintenance });
		} catch (error) {
			next(error);
		}
	};

	delete = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const id = req.params.id;
			if (!id) {
				return res.status(400).json({ message: "ID parameter is required" });
			}
			await this.maintenanceService.delete(id);
			res.status(204).json({ message: "OK" });
		} catch (error) {
			next(error);
		}
	};
}

export default MaintenanceController;
