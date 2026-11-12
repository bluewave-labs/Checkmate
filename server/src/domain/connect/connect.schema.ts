import { ConnectBackupKinds, ConnectScheduleIntervalHours } from "@/domain/connect/connect-backup.type.js";
import { z } from "zod";

export const connectTunnelStatusSchema = z
	.object({
		connected: z.boolean(),
		lastConnectedAt: z.string().nullable(),
		lastError: z.string().nullable(),
		closeCode: z.number().nullable(),
	})
	.meta({ id: "ConnectTunnelStatus" });

export const connectStatusSchema = z
	.object({
		enrolled: z.boolean(),
		agentId: z.string().nullable(),
		connectUrl: z.string().nullable(),
		apiUrl: z.string().nullable(),
		agentVersion: z.string(),
		remoteAccess: z.object({ enabled: z.boolean() }),
		tunnel: connectTunnelStatusSchema,
		backup: z.object({
			recoveryKeySet: z.boolean(),
			schedule: z
				.object({
					enabled: z.boolean(),
					intervalHours: z.literal(ConnectScheduleIntervalHours),
					kind: z.enum(ConnectBackupKinds),
				})
				.nullable(),
		}),
	})
	.meta({ id: "ConnectStatus" });
