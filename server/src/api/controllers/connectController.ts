import { RequestHandler, Response } from "express";
import { z } from "zod";
import { ApiEnvelope, Handler } from "./controllerUtils.js";
import type { ConnectResult, IConnectService } from "@/domain/connect/connect.service.js";

export const connectEnrollBodyValidation = z.object({
	connectUrl: z.string().regex(/^wss:\/\/[a-z0-9.-]+\/api\/tunnel$/, "Invalid Connect tunnel URL"),
	agentId: z.string().regex(/^[a-z0-9-]{1,64}$/, "Invalid agent id"),
	token: z.string().regex(/^cmk_[a-f0-9]{48}$/, "Invalid credential"),
	// Control-plane origin; optional for older credential blocks.
	apiUrl: z
		.string()
		.regex(/^https:\/\/[a-z0-9.-]+$/, "Invalid Connect API URL")
		.optional(),
});

export const connectRemoteAccessBodyValidation = z.object({
	enabled: z.boolean(),
});

export const connectBackupRunBodyValidation = z.object({
	kind: z.enum(["full", "config"]).optional(),
});

export const connectBackupGenerateKeyBodyValidation = z.object({
	discardExisting: z.boolean().optional(),
});

export const connectBackupImportKeyBodyValidation = z.object({
	recoveryKey: z
		.string()
		.trim()
		.regex(/^[a-fA-F0-9]{64}$/, "Recovery key must be 64 hexadecimal characters")
		.transform((key) => key.toLowerCase()),
});

export const connectBackupRestoreBodyValidation = z.object({
	backupId: z.string().regex(/^[0-9a-f-]{36}$/, "Invalid backup id"),
});

export const connectBackupScheduleBodyValidation = z.object({
	enabled: z.boolean(),
	intervalHours: z.number().int().min(1).max(168).optional(),
	kind: z.enum(["full", "config"]).optional(),
});

export interface IConnectController {
	getStatus: RequestHandler;
	enroll: RequestHandler;
	setRemoteAccess: RequestHandler;
	unenroll: RequestHandler;
	getBackupStatus: RequestHandler;
	getBackupList: RequestHandler;
	createBackupRecoveryKey: RequestHandler;
	importBackupRecoveryKey: RequestHandler;
	runBackup: RequestHandler;
	restoreBackup: RequestHandler;
	setBackupSchedule: RequestHandler;
}

const respond = (res: Response<ApiEnvelope>, result: ConnectResult, successMsg: string, failureMsg: string) => {
	const ok = result.status < 400;
	res.status(ok ? 200 : result.status).json({ success: ok, msg: ok ? successMsg : failureMsg, data: result.data });
};

// Names the reason, so a wrong key is not reported as a generic error.
const failureReason = (result: ConnectResult, fallback: string) => (typeof result.data.error === "string" ? result.data.error : fallback);

class ConnectController implements IConnectController {
	constructor(private connectService: IConnectService) {}

	getStatus: Handler = async (_req, res) => {
		respond(res, this.connectService.getStatus(), "Connect status retrieved", "Connect status failed");
	};

	enroll: Handler = async (req, res) => {
		const body = connectEnrollBodyValidation.parse(req.body);
		respond(res, await this.connectService.enroll(body), "Installation enrolled", "Enrollment failed");
	};

	setRemoteAccess: Handler = async (req, res) => {
		const { enabled } = connectRemoteAccessBodyValidation.parse(req.body);
		respond(
			res,
			await this.connectService.setRemoteAccess(enabled),
			enabled ? "Remote access enabled" : "Remote access disabled",
			"Updating remote access failed"
		);
	};

	unenroll: Handler = async (_req, res) => {
		respond(res, await this.connectService.unenroll(), "Installation unenrolled", "Unenroll failed");
	};

	getBackupStatus: Handler = async (_req, res) => {
		respond(res, this.connectService.getBackupStatus(), "Backup status retrieved", "Backup status failed");
	};

	getBackupList: Handler = async (_req, res) => {
		respond(res, await this.connectService.listBackups(), "Backup list retrieved", "Backup list failed");
	};

	// The response contains the recovery key exactly once; it is never logged.
	createBackupRecoveryKey: Handler = async (req, res) => {
		const { discardExisting } = connectBackupGenerateKeyBodyValidation.parse(req.body ?? {});
		const result = await this.connectService.createRecoveryKey({ discardExisting });
		respond(res, result, "Recovery key generated", failureReason(result, "Recovery key generation failed"));
	};

	importBackupRecoveryKey: Handler = async (req, res) => {
		const { recoveryKey } = connectBackupImportKeyBodyValidation.parse(req.body);
		const result = await this.connectService.importRecoveryKey(recoveryKey);
		respond(res, result, "Recovery key saved", failureReason(result, "Recovery key import failed"));
	};

	runBackup: Handler = async (req, res) => {
		const { kind } = connectBackupRunBodyValidation.parse(req.body);
		respond(res, this.connectService.runBackup(kind), "Backup started", "Backup start failed");
	};

	restoreBackup: Handler = async (req, res) => {
		const { backupId } = connectBackupRestoreBodyValidation.parse(req.body);
		respond(res, this.connectService.restoreBackup(backupId), "Restore started", "Restore start failed");
	};

	setBackupSchedule: Handler = async (req, res) => {
		const body = connectBackupScheduleBodyValidation.parse(req.body);
		respond(res, await this.connectService.setBackupSchedule(body), "Backup schedule updated", "Backup schedule update failed");
	};
}

export default ConnectController;
