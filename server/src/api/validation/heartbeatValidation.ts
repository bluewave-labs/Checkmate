import { z } from "zod";
import {
	HEARTBEAT_MAX_DURATION_MS,
	HEARTBEAT_MAX_EXIT_CODE,
	HEARTBEAT_MAX_INTERVAL_MS,
	HEARTBEAT_MAX_MESSAGE_LENGTH,
	HEARTBEAT_MIN_INTERVAL_MS,
	HEARTBEAT_SLUG_MAX_LENGTH,
	HEARTBEAT_SLUG_PATTERN,
} from "@/domain/heartbeat/heartbeat.type.js";
import { booleanCoercion } from "@/api/validation/shared.js";

export const heartbeatParamValidation = z.object({
	pingKey: z.string().min(16).max(64),
	slug: z.string().max(HEARTBEAT_SLUG_MAX_LENGTH).regex(HEARTBEAT_SLUG_PATTERN),
});

export const heartbeatExitCodeParamValidation = heartbeatParamValidation.extend({
	exitCode: z.coerce.number().int().min(0).max(HEARTBEAT_MAX_EXIT_CODE),
});

export const heartbeatQueryValidation = z.object({
	msg: z.string().max(HEARTBEAT_MAX_MESSAGE_LENGTH).optional(),
	duration: z.coerce.number().int().min(0).max(HEARTBEAT_MAX_DURATION_MS).optional(),
	create: booleanCoercion.optional(),
	interval: z.coerce.number().int().min(HEARTBEAT_MIN_INTERVAL_MS).max(HEARTBEAT_MAX_INTERVAL_MS).optional(),
});
