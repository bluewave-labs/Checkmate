import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";
import type { ISsoSessionService } from "@/domain/sso/sso-session.service.js";
import type { ISsoLoginService } from "@/domain/sso/sso-login.service.js";
import { ssoRedeemBodyValidation, ssoRefreshBodyValidation, ssoStartBodyValidation } from "@/api/validation/ssoValidation.js";

export interface ISsoController {
	getSsoStatus: RequestHandler;
	startSso: RequestHandler;
	redeemSso: RequestHandler;
	refreshSession: RequestHandler;
	logoutSession: RequestHandler;
}

class SsoController implements ISsoController {
	constructor(
		private ssoSessionService: ISsoSessionService,
		private ssoLoginService: ISsoLoginService
	) {}

	getSsoStatus: Handler = async (_req, res) => {
		const data = await this.ssoLoginService.status();
		res.json({ success: true, msg: "Single sign-on status", data });
	};

	startSso: Handler = async (req, res) => {
		const { returnOrigin } = ssoStartBodyValidation.parse(req.body);
		const data = await this.ssoLoginService.start(returnOrigin);
		res.json({ success: true, msg: "Single sign-on started", data });
	};

	redeemSso: Handler = async (req, res) => {
		const { code, state } = ssoRedeemBodyValidation.parse(req.body);
		const data = await this.ssoLoginService.redeem(code, state);
		res.json({ success: true, msg: "Logged in", data });
	};

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
