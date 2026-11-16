import { z } from "zod";
import {
	CONNECT_RECOVERY_KEY_FORMAT,
	ConnectBackupKinds,
	ConnectBackupToolNames,
	ConnectOperationStates,
	ConnectOperations,
	ConnectProgressStages,
	ConnectVerifyOutcomes,
} from "@/domain/connect/connect-backup.type.js";

// ************************
// Checkmate schemas
// ************************

// Result of the last backup or restore, shared by the status response
const connectResultSchema = z.object({
	ok: z.boolean(),
	at: z.string(),
	kind: z.enum(ConnectBackupKinds).nullable(),
	sizeBytes: z.number().nullable(),
	sha256: z.string().nullable(),
	backupId: z.string().nullable(),
	durationMs: z.number().nullable(),
	error: z.string().nullable(),
});

// Response for GET /connect/backup/status
export const connectBackupStatusSchema = z
	.object({
		operation: z
			.object({
				type: z.enum(ConnectOperations),
				state: z.enum(ConnectOperationStates),
				requestedAt: z.string(),
			})
			.nullable(),
		progress: z
			.object({
				operation: z.enum(ConnectOperations),
				stage: z.enum(ConnectProgressStages),
				percent: z.number().nullable(),
				bytes: z.number().nullable(),
				attempt: z.number().nullable(),
				attempts: z.number().nullable(),
			})
			.nullable(),
		lastBackup: connectResultSchema.nullable(),
		lastRestore: connectResultSchema.nullable(),
		lastVerify: z
			.object({
				outcome: z.enum(ConnectVerifyOutcomes),
				at: z.string(),
				error: z.string().nullable(),
			})
			.nullable(),
		missingTools: z.array(z.enum(ConnectBackupToolNames)),
	})
	.meta({ id: "ConnectBackupStatus" });

// Response for GET /connect/backup/list
export const connectBackupListSchema = z
	.object({
		backups: z.array(
			z.object({
				id: z.string(),
				kind: z.string(),
				sizeBytes: z.number(),
				status: z.string(),
				createdAt: z.string(),
				keyId: z.string().nullable(),
				expiresAt: z.string().nullable(),
				restorable: z.boolean(),
			})
		),
	})
	.meta({ id: "ConnectBackupList" });

// Response for POST /connect/backup/recovery-key
export const connectRecoveryKeySchema = z
	.object({
		recoveryKey: z.string(),
		format: z.literal(CONNECT_RECOVERY_KEY_FORMAT),
	})
	.meta({ id: "ConnectRecoveryKey" });

// Response for POST /connect/backup/run, /connect/backup/restore and /connect/backup/recovery-key/import
export const connectQueuedSchema = z
	.object({
		queued: z.literal(true),
	})
	.meta({ id: "ConnectQueued" });

// ************************
// Connect schemas
// ************************

// Error body returned by the Connect API
export const connectApiErrorSchema = z.object({
	error: z.string(),
});

// Connect API reply to a request to upload a backup
export const connectApiUploadTicketSchema = z.object({
	uploadUrl: z.string(),
	backupId: z.string(),
});

// Connect API reply to a request to download a backup
export const connectApiDownloadTicketSchema = z.object({
	downloadUrl: z.string(),
	sha256: z.string(),
	sizeBytes: z.number(),
});

// Connect API reply listing backups for this installation
export const connectApiBackupListSchema = z.object({
	backups: z
		.array(
			z.object({
				id: z.string(),
				kind: z.string(),
				sizeBytes: z.number(),
				status: z.string(),
				createdAt: z.string(),
				keyId: z.string().nullish(),
				expiresAt: z.string().nullish(),
			})
		)
		.default([]),
});
