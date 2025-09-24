import { Request, Response, NextFunction } from "express";
import NotificationService from "../../service/v2/business/NotificationChannelService.js";

class NotificationChannelController {
	private notificationService: NotificationService;
	constructor(notificationService: NotificationService) {
		this.notificationService = notificationService;
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}
			const channel = await this.notificationService.create(tokenizedUser, req.body);
			res.status(201).json({ message: "OK", data: channel });
		} catch (error) {
			next(error);
		}
	};

	getAll = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const notificationChannels = await this.notificationService.getAll();
			res.status(200).json({
				message: "OK",
				data: notificationChannels,
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
			const notificationChannel = await this.notificationService.toggleActive(tokenizedUser, id);
			res.status(200).json({ message: "OK", data: notificationChannel });
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
			const updatedChannel = await this.notificationService.update(tokenizedUser, id, req.body);
			res.status(200).json({ message: "OK", data: updatedChannel });
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
			const notificationChannel = await this.notificationService.get(id);
			res.status(200).json({ message: "OK", data: notificationChannel });
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
			await this.notificationService.delete(id);
			res.status(204).json({ message: "OK" });
		} catch (error) {
			next(error);
		}
	};
}

export default NotificationChannelController;
