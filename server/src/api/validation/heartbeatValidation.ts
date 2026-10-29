import { z } from "zod";
import { HEARTBEAT_MAX_DURATION_MS, HEARTBEAT_MAX_EXIT_CODE, HEARTBEAT_MAX_MESSAGE_LENGTH } from "@/domain/heartbeat/heartbeat.type.js";

export const heartbeatParamValidation = z.object({
	token: z.string().min(16).max(64),
});

export const heartbeatExitCodeParamValidation = heartbeatParamValidation.extend({
	exitCode: z.coerce.number().int().min(0).max(HEARTBEAT_MAX_EXIT_CODE),
});

export const heartbeatQueryValidation = z.object({
	msg: z.string().max(HEARTBEAT_MAX_MESSAGE_LENGTH).optional(),
	duration: z.coerce.number().int().min(0).max(HEARTBEAT_MAX_DURATION_MS).optional(),
});
