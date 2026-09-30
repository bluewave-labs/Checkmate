import { RequestHandler } from "express";
import { inviteBodyValidation, inviteVerificationBodyValidation } from "@/api/validation/authValidation.js";
import { Handler, requireFirstName, requireTeamId, requireUserRoles } from "@/api/controllers/controllerUtils.js";
import { IInviteService } from "@/domain/invites/invite.service.js";

export interface IInviteController {
	getInviteToken: RequestHandler;
	sendInviteEmail: RequestHandler;
	verifyInviteToken: RequestHandler;
}

class InviteController implements IInviteController {
	private inviteService: IInviteService;
	constructor(inviteService: IInviteService) {
		this.inviteService = inviteService;
	}

	getInviteToken: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const userRoles = requireUserRoles(req.user?.role);
		const invite = inviteBodyValidation.parse({ ...req.body, teamId });
		const data = await this.inviteService.getInviteToken({ invite, teamId, userRoles });
		res.json({ success: true, msg: "Invite token generated successfully", data });
	};

	sendInviteEmail: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const userRoles = requireUserRoles(req.user?.role);
		const firstName = requireFirstName(req.user?.firstName);

		const invite = inviteBodyValidation.parse({ ...req.body, teamId });
		await this.inviteService.sendInviteEmail({ invite, firstName, userRoles });
		res.json({ success: true, msg: "Invite issued successfully" });
	};

	verifyInviteToken: Handler = async (req, res) => {
		const { token } = inviteVerificationBodyValidation.parse(req.body);
		const data = await this.inviteService.verifyInviteToken({ inviteToken: token });
		res.json({ success: true, msg: "Invite verified successfully", data });
	};
}

export default InviteController;
