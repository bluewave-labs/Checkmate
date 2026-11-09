import type { connectStatusSchema } from "@/domain/connect/connect.schema.js";
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
};

export type ConnectStatus = z.infer<typeof connectStatusSchema>;
