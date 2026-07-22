import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/api/validation/authValidation.js";
import { requireFirstName, requireTeamId, requireUserRoles } from "@/api/controllers/controllerUtils.js";
import { IInviteService } from "@/domain/invites/invite.service.js";
const SERVICE_NAME = "inviteController";

export interface IInviteController {
	getInviteToken: RequestHandler;
	sendInviteEmail: RequestHandler;
	verifyInviteToken: RequestHandler;
}

class InviteController implements IInviteController {
	static SERVICE_NAME = SERVICE_NAME;
	private inviteService: IInviteService;
	constructor(inviteService: IInviteService) {
		this.inviteService = inviteService;
	}

	getInviteToken = catchAsync(async (req: Request, res: Response) => {
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
	});

	sendInviteEmail = catchAsync(async (req: Request, res: Response) => {
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
	});

	verifyInviteToken = catchAsync(async (req: Request, res: Response) => {
		inviteVerificationBodyValidation.parse(req.body);
		const invite = await this.inviteService.verifyInviteToken({ inviteToken: req?.body?.token });
		return res.status(200).json({
			success: true,
			msg: "Invite verified successfully",
			data: invite,
		});
	});
}

export default InviteController;
