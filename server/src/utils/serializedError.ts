import { z } from "zod";
import { serializedErrorSchema } from "@/utils/logger.schema.js";
import { AppError } from "@/utils/AppError.js";

const MAX_CAUSE_DEPTH = 3;

export type SerializedError = z.infer<typeof serializedErrorSchema>;

export const serializeError = (error: unknown, depth = 0): SerializedError => {
	if (!(error instanceof Error)) {
		return { name: "NonError", message: String(error) };
	}
	const serialized: SerializedError = { name: error.name, message: error.message, stack: error.stack };
	if (error instanceof AppError) {
		serialized.status = error.status;
		serialized.service = error.service;
		serialized.method = error.method;
		serialized.details = error.details;
	}

	if (error.cause !== undefined && depth < MAX_CAUSE_DEPTH) {
		serialized.cause = serializeError(error.cause, depth + 1);
	}
	return serialized;
};
