import { z } from "zod";
import {
	ScriptRuntimes,
	ScriptExecutionTargets,
	SCRIPT_BODY_MAX_BYTES,
	SCRIPT_NAME_MAX_LENGTH,
	SCRIPT_MAX_EXECUTION_TIME_MS_DEFAULT,
	SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP,
} from "@/types/script.js";

// Script body must contain no null bytes (defense against process arg
// smuggling) and must fit within SCRIPT_BODY_MAX_BYTES UTF-8 bytes.
const NULL_BYTE = String.fromCharCode(0);
const containsNullByte = (value: string): boolean => value.indexOf(NULL_BYTE) !== -1;

const scriptBodyValidation = z
	.string()
	.min(1, "Script body is required")
	.refine((v) => !containsNullByte(v), "Script body must not contain null bytes")
	.refine((v) => Buffer.byteLength(v, "utf8") <= SCRIPT_BODY_MAX_BYTES, `Script body exceeds ${SCRIPT_BODY_MAX_BYTES} bytes`);

const parametersValidation = z.record(z.string(), z.string());

const objectIdLike = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ID format");

const regexStringValidation = z
	.string()
	.refine(
		(value) => {
			if (!value || value.length === 0) return true;
			try {
				new RegExp(value);
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Must be a valid regular expression" }
	);

export const createScriptBodyValidation = z.object({
	name: z.string().trim().min(1, "Name is required").max(SCRIPT_NAME_MAX_LENGTH, `Name must be at most ${SCRIPT_NAME_MAX_LENGTH} characters`),
	description: z.string().max(1024).optional(),
	runtime: z.enum(ScriptRuntimes, "Invalid runtime"),
	body: scriptBodyValidation,
	parameters: parametersValidation.optional(),
});

export const updateScriptBodyValidation = z.object({
	name: z
		.string()
		.trim()
		.min(1)
		.max(SCRIPT_NAME_MAX_LENGTH, `Name must be at most ${SCRIPT_NAME_MAX_LENGTH} characters`)
		.optional(),
	description: z.string().max(1024).optional(),
	runtime: z.enum(ScriptRuntimes).optional(),
	body: scriptBodyValidation.optional(),
	parameters: parametersValidation.optional(),
});

export const scriptIdParamValidation = z.object({
	scriptId: objectIdLike,
});

export const createProbeBodyValidation = z.object({
	name: z.string().trim().min(1).max(SCRIPT_NAME_MAX_LENGTH),
	url: z.string().url("URL must be a valid URL"),
	probeSecret: z.string().min(32, "probeSecret must be at least 32 characters"),
});

export const probeIdParamValidation = z.object({
	probeId: objectIdLike,
});

// monitorScriptFields validates the script-monitor-specific subset of a Monitor
// body. It is consumed by the monitor controller via z.intersection or
// .extend() so script monitors can be created through the standard
// POST /monitors endpoint.
export const monitorScriptFields = z.object({
	scriptId: objectIdLike.optional(),
	scriptExecutionTarget: z.enum(ScriptExecutionTargets).optional(),
	probeId: objectIdLike.optional(),
	scriptExitCodeSuccess: z.number().int().min(0).max(255).default(0),
	scriptOutputMatchRegex: z.union([regexStringValidation, z.literal("")]).optional(),
	scriptMaxExecutionTimeMs: z
		.number()
		.int()
		.min(1000)
		.max(SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP)
		.default(SCRIPT_MAX_EXECUTION_TIME_MS_DEFAULT),
	scriptParameterOverrides: parametersValidation.optional(),
});

export type CreateScriptInputDTO = z.infer<typeof createScriptBodyValidation>;
export type UpdateScriptInputDTO = z.infer<typeof updateScriptBodyValidation>;
export type CreateProbeInputDTO = z.infer<typeof createProbeBodyValidation>;
