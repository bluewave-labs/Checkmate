import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";
import { IAppVersionService } from "@/domain/app-version/app-version.service.js";

const SERVICE_NAME = "AppVersionController";

export interface IAppVersionController {
	getVersionInfo: RequestHandler;
}

class AppVersionController implements IAppVersionController {
	static SERVICE_NAME = SERVICE_NAME;

	private appVersionService: IAppVersionService;
	constructor(appVersionService: IAppVersionService) {
		this.appVersionService = appVersionService;
	}

	getVersionInfo: Handler = async (req, res) => {
		const data = await this.appVersionService.getVersionInfo();
		res.json({ success: true, msg: "Got version info", data });
	};
}

export default AppVersionController;
