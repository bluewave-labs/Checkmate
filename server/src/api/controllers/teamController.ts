import { RequestHandler } from "express";
import { Handler, requireTeamId, requireUserId } from "@/api/controllers/controllerUtils.js";
import type { ITeamService } from "@/domain/teams/team.service.js";

export interface ITeamController {
	getHeartbeatKeyStatus: RequestHandler;
	rotateHeartbeatKey: RequestHandler;
}

class TeamController implements ITeamController {
	constructor(private teamService: ITeamService) {}

	getHeartbeatKeyStatus: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.teamService.getHeartbeatKeyStatus(teamId);
		res.json({
			success: true,
			msg: "Heartbeat key status retrieved successfully",
			data,
		});
	};

	rotateHeartbeatKey: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const userId = requireUserId(req.user?.id);
		const data = await this.teamService.rotateHeartbeatKey(teamId, userId);
		res.json({
			success: true,
			msg: "Heartbeat key rotated successfully",
			data,
		});
	};
}

export default TeamController;
