import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";
import { IConnectService } from "@/domain/connect/connect.service.js";
import {
	connectEnrollBodyValidation,
	connectGenerateKeyBodyValidation,
	connectRemoteAccessBodyValidation,
	connectRunBackupBodyValidation,
} from "@/api/validation/connectValidation.js";

export interface IConnectController {
	getStatus: RequestHandler;
	enroll: RequestHandler;
	unenroll: RequestHandler;
	setRemoteAccess: RequestHandler;
	getBackupStatus: RequestHandler;
	getBackupList: RequestHandler;
	createBackupRecoveryKey: RequestHandler;
	runBackup: RequestHandler;
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

	getBackupStatus: Handler = async (req, res) => {
		const data = await this.connectService.getBackupStatus();
		res.json({ success: true, msg: "Backup status retrieved", data });
	};

	getBackupList: Handler = async (req, res) => {
		const data = await this.connectService.listBackups();
		res.json({ success: true, msg: "Backup list retrieved", data });
	};

	createBackupRecoveryKey: Handler = async (req, res) => {
		const { discardExisting } = connectGenerateKeyBodyValidation.parse(req.body ?? {});
		const data = await this.connectService.createRecoveryKey(discardExisting);
		res.json({ success: true, msg: "Recovery key generated", data });
	};

	runBackup: Handler = async (req, res) => {
		const { kind } = connectRunBackupBodyValidation.parse(req.body ?? {});
		const data = await this.connectService.runBackup(kind);
		res.json({ success: true, msg: "Backup started", data });
	};
}

export default ConnectController;
