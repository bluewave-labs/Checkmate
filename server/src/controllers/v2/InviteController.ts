import { Request, Response, NextFunction } from "express";
import InviteService from "../../service/v2/business/InviteService.js";

class InviteController {
	private inviteService: InviteService;
	constructor(inviteService: InviteService) {
		this.inviteService = inviteService;
	}

	create = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const tokenizedUser = req.user;
			if (!tokenizedUser) {
				return res.status(401).json({ message: "Unauthorized" });
			}
			const invite = await this.inviteService.create(tokenizedUser, req.body);
			res.status(201).json({ message: "OK", data: invite });
		} catch (error: any) {
			next(error);
		}
	};

	getAll = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const invites = await this.inviteService.getAll();
			res.status(200).json({
				message: "OK",
				data: invites,
			});
		} catch (error) {
			next(error);
		}
	};

	get = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.params.token;
			if (!token) {
				return res.status(400).json({ message: "Token parameter is required" });
			}
			const invite = await this.inviteService.get(token);
			res.status(200).json({ message: "OK", data: invite });
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
			await this.inviteService.delete(id);
			res.status(204).json({ message: "OK" });
		} catch (error: any) {
			next(error);
		}
	};
}

export default InviteController;
