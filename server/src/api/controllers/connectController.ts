import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";
import { IConnectService } from "@/domain/connect/connect.service.js";
import { connectEnrollBodyValidation, connectRemoteAccessBodyValidation } from "@/api/validation/connectValidation.js";

export interface IConnectController {
	getStatus: RequestHandler;
	enroll: RequestHandler;
	unenroll: RequestHandler;
	setRemoteAccess: RequestHandler;
}

class ConnectController implements IConnectController {
	constructor(private connectService: IConnectService) {}

	getStatus: Handler = async (req, res) => {
		const data = await this.connectService.getStatus();
		res.json({ success: true, msg: "Connect status retrieved", data });
	};

	enroll: Handler = async (req, res) => {
		const body = connectEnrollBodyValidation.parse(req.body);
		const data = await this.connectService.enroll(body);
		res.json({ success: true, msg: "Installation enrolled", data });
	};

	unenroll: Handler = async (req, res) => {
		const data = await this.connectService.unenroll();
		res.json({ success: true, msg: "Installation unenrolled", data });
	};

	setRemoteAccess: Handler = async (req, res) => {
		const { enabled } = connectRemoteAccessBodyValidation.parse(req.body);
		const data = await this.connectService.setRemoteAccess(enabled);
		res.json({ success: true, msg: enabled ? "Remote access enabled" : "Remote access disabled", data });
	};
}

export default ConnectController;
