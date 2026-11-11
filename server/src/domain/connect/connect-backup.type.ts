import type { z } from "zod";
import type {
	connectBackupListSchema,
	connectBackupStatusSchema,
	connectQueuedSchema,
	connectRecoveryKeySchema,
	connectApiBackupListSchema,
	connectApiUploadTicketSchema,
} from "@/domain/connect/connect-backup.schema.js";
import type { Readable } from "node:stream";

export const CONNECT_RECOVERY_KEY_FORMAT = "CMKB1";

export const ConnectBackupKinds = ["full", "config"] as const;
export type ConnectBackupKind = (typeof ConnectBackupKinds)[number];

export const ConnectOperations = ["backup"] as const;
export type ConnectOperation = (typeof ConnectOperations)[number];

export const ConnectOperationStates = ["queued", "running"] as const;
export type ConnectOperationState = (typeof ConnectOperationStates)[number];

export const ConnectProgressStages = ["dumping", "uploading", "saving"] as const;
export type ConnectProgressStage = (typeof ConnectProgressStages)[number];

export const ConnectBackupToolNames = ["mongodump", "mongorestore"] as const;
export type ConnectBackupToolName = (typeof ConnectBackupToolNames)[number];

export type ConnectOperationRequest = {
	type: ConnectOperation;
	kind: ConnectBackupKind;
	requestedAt: Date;
	startedAt: Date | null;
};

export type ConnectBackupResult = {
	ok: boolean;
	at: Date;
	kind: ConnectBackupKind;
	sizeBytes: number | null;
	sha256: string | null;
	backupId: string | null;
	durationMs: number | null;
	error: string | null;
};

export type ConnectSealedArchive = {
	sizeBytes: number;
	sha256: string;
};

export type ConnectBackupUpload = ConnectSealedArchive & {
	kind: ConnectBackupKind;
	keyId: string;
};

export type ConnectDump = {
	stdout: Readable;
	exited: Promise<void>;
};

export type ConnectBackupStatus = z.infer<typeof connectBackupStatusSchema>;
export type ConnectProgress = NonNullable<ConnectBackupStatus["progress"]>;
export type ConnectBackupList = z.infer<typeof connectBackupListSchema>;
export type ConnectRecoveryKey = z.infer<typeof connectRecoveryKeySchema>;
export type ConnectQueued = z.infer<typeof connectQueuedSchema>;
export type ConnectApiUploadTicket = z.infer<typeof connectApiUploadTicketSchema>;
export type ConnectApiBackup = z.infer<typeof connectApiBackupListSchema>["backups"][number];
