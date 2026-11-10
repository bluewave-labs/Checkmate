import type { connectStatusSchema, connectTunnelStatusSchema } from "@/domain/connect/connect.schema.js";
import type { z } from "zod";

export const CONNECT_STATE_COLLECTION = "connect_state";
export const DEFAULT_CONNECT_HOSTS = ["connect.checkmate.so", "relay.checkmate.so"] as const;

// Internal (never returned by the API)
export type ConnectEnrollment = {
	connectUrl: string;
	agentId: string;
	token: string;
	apiUrl: string | null;
};
export type ConnectState = {
	enrollment: ConnectEnrollment | null;
	remoteAccessEnabled: boolean;
};

export type ConnectStatus = z.infer<typeof connectStatusSchema>;

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
