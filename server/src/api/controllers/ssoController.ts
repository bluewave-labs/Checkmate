import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";
import type { ISsoSessionService } from "@/domain/sso/sso-session.service.js";
import { ssoRefreshBodyValidation } from "@/api/validation/ssoValidation.js";

export interface ISsoController {
	refreshSession: RequestHandler;
	logoutSession: RequestHandler;
}

class SsoController implements ISsoController {
	constructor(private ssoSessionService: ISsoSessionService) {}

	refreshSession: Handler = async (req, res) => {
		const { refreshToken } = ssoRefreshBodyValidation.parse(req.body);
		const data = await this.ssoSessionService.refresh(refreshToken);
		res.json({ success: true, msg: "Session refreshed", data });
	};

	logoutSession: Handler = async (req, res) => {
		const { refreshToken } = ssoRefreshBodyValidation.parse(req.body);
		await this.ssoSessionService.logout(refreshToken);
		res.json({ success: true, msg: "Logged out", data: null });
	};
}

export default SsoController;
