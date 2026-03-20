import { Request, Response, NextFunction } from "express";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/validation/authValidation.js";
import { requireFirstName, requireTeamId, requireUserRoles } from "@/controllers/controllerUtils.js";
import { IInviteService } from "@/service/index.js";
const SERVICE_NAME = "inviteController";

export interface IInviteController {
	getInviteToken: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	sendInviteEmail: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	verifyInviteToken: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
}

class InviteController implements IInviteController {
	static SERVICE_NAME = SERVICE_NAME;
	private inviteService: IInviteService;
	constructor(inviteService: IInviteService) {
		this.inviteService = inviteService;
	}

	get serviceName() {
		return InviteController.SERVICE_NAME;
	}

	getInviteToken = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const userRoles = requireUserRoles(req.user?.role);
			const invite = req.body;
			invite.teamId = teamId;
			inviteBodyValidation.parse(invite);
			const inviteToken = await this.inviteService.getInviteToken({ invite, teamId, userRoles });
			return res.status(200).json({
				success: true,
				msg: "Invite token generated successfully",
				data: inviteToken,
			});
		} catch (error) {
			next(error);
		}
	};

	sendInviteEmail = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const userRoles = requireUserRoles(req.user?.role);
			const firstName = requireFirstName(req.user?.firstName);

			const inviteRequest = req.body;
			inviteRequest.teamId = teamId;
			inviteBodyValidation.parse(inviteRequest);

			const inviteToken = await this.inviteService.sendInviteEmail({
				invite: inviteRequest,
				firstName,
				userRoles,
			});
			return res.status(200).json({
				success: true,
				msg: "Invite issued successfully",
				data: inviteToken,
			});
		} catch (error) {
			next(error);
		}
	};

	verifyInviteToken = async (req: Request, res: Response, next: NextFunction) => {
		try {
			inviteVerificationBodyValidation.parse(req.body);
			const invite = await this.inviteService.verifyInviteToken({ inviteToken: req?.body?.token });
			return res.status(200).json({
				success: true,
				msg: "Invite verified successfully",
				data: invite,
			});
		} catch (error) {
			next(error);
		}
	};
}

export default InviteController;
