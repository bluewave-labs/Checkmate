import { z } from "zod";
import { ConnectBackupKinds } from "@/domain/connect/connect-backup.type.js";

export const connectEnrollBodyValidation = z.object({
	connectUrl: z.string().regex(/^wss:\/\/[a-z0-9.-]+\/api\/tunnel$/, "Invalid Connect tunnel URL"),
	agentId: z.string().regex(/^[a-z0-9-]{1,64}$/, "Invalid agent id"),
	token: z.string().regex(/^cmk_[a-f0-9]{48}$/, "Invalid credential"),
	apiUrl: z
		.string()
		.regex(/^https:\/\/[a-z0-9.-]+$/, "Invalid Connect API URL")
		.nullable()
		.default(null),
});

export const connectRemoteAccessBodyValidation = z.object({
	enabled: z.boolean(),
});

export const connectGenerateKeyBodyValidation = z.object({
	discardExisting: z.boolean().default(false),
});

export const connectRunBackupBodyValidation = z.object({
	kind: z.enum(ConnectBackupKinds).default("full"),
});

export const connectImportKeyBodyValidation = z.object({
	recoveryKey: z
		.string()
		.trim()
		.regex(/^[a-fA-F0-9]{64}$/, "Recovery key must be 64 hexadecimal characters")
		.transform((key) => key.toLowerCase()),
	replaceExisting: z.boolean().default(false),
});

export const connectRestoreBodyValidation = z.object({
	backupId: z.string().regex(/^[0-9a-f-]{36}$/, "Invalid backup id"),
});
