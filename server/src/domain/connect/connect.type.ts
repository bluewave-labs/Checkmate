import type { connectStatusSchema } from "@/domain/connect/connect.schema.js";
import type { z } from "zod";

export const CONNECT_STATE_COLLECTION = "connect_state";
export const DEFAULT_CONNECT_HOSTS = ["connect.checkmate.so", "relay.checkmate.so"] as const;

export const CONNECT_TUNNEL_URL_PATTERN = /^wss:\/\/[a-z0-9.-]+\/api\/tunnel$/;
export const CONNECT_AGENT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
export const CONNECT_TOKEN_PATTERN = /^cmk_[a-f0-9]{48}$/;
export const CONNECT_API_URL_PATTERN = /^https:\/\/[a-z0-9.-]+$/;

// Internal (never returned by the API)
export type ConnectEnrollment = {
	connectUrl: string;
	agentId: string;
	token: string;
	apiUrl: string | null;
};
export type ConnectState = {
	enrollment: ConnectEnrollment | null;
};

export type ConnectStatus = z.infer<typeof connectStatusSchema>;
