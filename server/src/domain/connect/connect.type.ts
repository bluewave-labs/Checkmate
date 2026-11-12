import type { ConnectBackupResult, ConnectOperationRequest, ConnectProgress, ConnectVerifyResult } from "@/domain/connect/connect-backup.type.js";
import type { connectStatusSchema, connectTunnelStatusSchema } from "@/domain/connect/connect.schema.js";
import type { z } from "zod";

export const CONNECT_STATE_COLLECTION = "connect_state";
export const DEFAULT_CONNECT_HOSTS = ["connect.checkmate.so", "relay.checkmate.so"] as const;
export const CONNECT_TUNNEL_HEADER = "x-checkmate-connect-tunnel";

// **********************
// Connect enrollment
// **********************

export type ConnectEnrollment = {
	connectUrl: string;
	agentId: string;
	token: string;
	apiUrl: string | null;
};
export type ConnectState = {
	enrollment: ConnectEnrollment | null;
	remoteAccessEnabled: boolean;
	recoveryKey: string | null;
	operation: ConnectOperationRequest | null;
	progress: ConnectProgress | null;
	lastBackup: ConnectBackupResult | null;
	lastRestore: ConnectBackupResult | null;
	lastVerify: ConnectVerifyResult | null;
};

export type ConnectStatus = z.infer<typeof connectStatusSchema>;

// **********************
// Connect tunnel
// **********************

export type ConnectTunnelStatus = z.infer<typeof connectTunnelStatusSchema>;

export type ConnectTunnelRequest = {
	type: "request";
	id: string;
	method: string;
	path: string;
	headers: Record<string, string>;
	body: string | null;
};

export type ConnectTunnelResponse = {
	type: "response";
	id: string;
	status: number;
	headers: Record<string, string>;
	body: string | null;
};
