import { Request, Response, NextFunction } from "express";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/validation/joi.js";
const SERVICE_NAME = "inviteController";

class InviteController {
	static SERVICE_NAME = SERVICE_NAME;
	private inviteService: any;
	constructor(inviteService: any) {
		this.inviteService = inviteService;
	}

	get serviceName() {
		return InviteController.SERVICE_NAME;
	}

	getInviteToken = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const invite = req.body;
			const teamId = req?.user?.teamId;
			invite.teamId = teamId;
			await inviteBodyValidation.validateAsync(invite);
			const inviteToken = await this.inviteService.getInviteToken({ invite, teamId });
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
			const inviteRequest = req.body;
			inviteRequest.teamId = req?.user?.teamId;
			await inviteBodyValidation.validateAsync(inviteRequest);

			const inviteToken = await this.inviteService.sendInviteEmail({
				inviteRequest,
				firstName: req?.user?.firstName,
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
			await inviteVerificationBodyValidation.validateAsync(req.body);
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
