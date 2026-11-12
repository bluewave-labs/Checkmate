import type { IConnectController } from "@/api/controllers/connectController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	connectEnrollBodyValidation,
	connectGenerateKeyBodyValidation,
	connectRemoteAccessBodyValidation,
	connectRunBackupBodyValidation,
} from "@/api/validation/connectValidation.js";
import { connectErrors } from "@/domain/connect/connect.errors.js";
import { connectStatusSchema } from "@/domain/connect/connect.schema.js";
import {
	connectBackupListSchema,
	connectBackupStatusSchema,
	connectQueuedSchema,
	connectRecoveryKeySchema,
} from "@/domain/connect/connect-backup.schema.js";

export const connectRoutes: RouteTable<IConnectController> = {
	prefix: "/connect",
	tag: "connect",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/status",
			handler: "getStatus",
			summary: "Get this installation's Checkmate Connect enrollment status (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: connectStatusSchema,
		},
		{
			method: "post",
			path: "/enroll",
			handler: "enroll",
			summary: "Enroll this installation with Checkmate Connect using a credential block (superadmin)",
			roles: ["superadmin"],
			body: connectEnrollBodyValidation,
			errors: [connectErrors.hostNotAllowed, connectErrors.encryptionKeyMissing],
			response: connectStatusSchema,
		},
		{
			method: "post",
			path: "/unenroll",
			handler: "unenroll",
			summary: "Remove this installation's Checkmate Connect enrollment (superadmin)",
			roles: ["superadmin"],
			response: connectStatusSchema,
		},
		{
			method: "post",
			path: "/remote-access",
			handler: "setRemoteAccess",
			summary: "Turn Checkmate Connect remote access on or off (superadmin)",
			roles: ["superadmin"],
			body: connectRemoteAccessBodyValidation,
			errors: [connectErrors.notEnrolled, connectErrors.stateUnavailable],
			response: connectStatusSchema,
		},
		{
			method: "get",
			path: "/backup/status",
			handler: "getBackupStatus",
			summary: "Get the state of this installation's Checkmate Connect cloud backups (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: connectBackupStatusSchema,
		},
		{
			method: "get",
			path: "/backup/list",
			handler: "getBackupList",
			summary: "List this installation's Checkmate Connect cloud backups (admin/superadmin)",
			roles: ["admin", "superadmin"],
			errors: [connectErrors.notEnrolled, connectErrors.stateUnavailable, connectErrors.connectUnreachable],
			response: connectBackupListSchema,
		},
		{
			method: "post",
			path: "/backup/recovery-key",
			handler: "createBackupRecoveryKey",
			summary: "Generate the recovery key that encrypts cloud backups; it is returned only once (superadmin)",
			roles: ["superadmin"],
			body: connectGenerateKeyBodyValidation,
			errors: [
				connectErrors.notEnrolled,
				connectErrors.recoveryKeyAlreadySet,
				connectErrors.encryptionKeyMissing,
				connectErrors.stateUnavailable,
				connectErrors.connectUnreachable,
				connectErrors.cloudBackupsExist,
			],
			response: connectRecoveryKeySchema,
		},
		{
			method: "post",
			path: "/backup/run",
			handler: "runBackup",
			summary: "Queue an encrypted Checkmate Connect cloud backup (superadmin)",
			roles: ["superadmin"],
			body: connectRunBackupBodyValidation,
			errors: [connectErrors.notEnrolled, connectErrors.noRecoveryKey, connectErrors.busy],
			response: connectQueuedSchema,
		},
	],
};
