import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError.js";
import MonitorService from "../../service/v2/business/MonitorService.js";
import { MonitorType } from "../../db/v1/models/Monitor.js";
class MonitorController {
	private monitorService: MonitorService;
	constructor(monitorService: MonitorService) {
		this.monitorService = monitorService;
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			const monitor = await this.monitorService.create(tokenizedUser, req.body);
			res.status(201).json({
				message: "Monitor created successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	get = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			const id = req.params.id;
			if (!id) {
				throw new ApiError("Monitor ID is required", 400);
			}

			const range = req.query.range;
			if (!range || typeof range !== "string") throw new ApiError("Range query parameter is required", 400);

			let monitor;

			const status = req.query.status;
			if (status && typeof status !== "string") {
				throw new ApiError("Status query parameter must be a string", 400);
			}

			if (req.query.embedChecks === "true") {
				monitor = await this.monitorService.getEmbedChecks(id, range, status);
			} else {
				monitor = await this.monitorService.get(id);
			}

			res.status(200).json({
				message: "Monitor retrieved successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	getAll = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			let monitors;
			if (req.query.embedChecks === "true") {
				const page = Math.max(1, Number(req.query.page) || 1);
				const limit = Math.max(1, Number(req.query.limit) || 10);
				const type: MonitorType[] = req.query.type as MonitorType[];

				monitors = await this.monitorService.getAllEmbedChecks(page, limit, type);
			} else {
				monitors = await this.monitorService.getAll();
			}

			res.status(200).json({
				message: "Monitors retrieved successfully",
				data: monitors,
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
				throw new ApiError("Monitor ID is required", 400);
			}

			const monitor = await this.monitorService.toggleActive(id, tokenizedUser);
			res.status(200).json({
				message: "Monitor paused/unpaused successfully",
				data: monitor,
			});
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
				throw new ApiError("Monitor ID is required", 400);
			}

			const monitor = await this.monitorService.update(tokenizedUser, id, req.body);
			res.status(200).json({
				message: "Monitor updated successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	delete = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}
			const id = req.params.id;
			if (!id) {
				throw new ApiError("Monitor ID is required", 400);
			}
			await this.monitorService.delete(id);

			res.status(200).json({
				message: "Monitor deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default MonitorController;
