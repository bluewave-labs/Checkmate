import { z } from "zod";
import { serializedErrorSchema } from "@/utils/logger.schema.js";
import { AppError } from "@/utils/AppError.js";

const MAX_CAUSE_DEPTH = 3;
const MAX_AGGREGATED_ERRORS = 5;

export type SerializedError = z.infer<typeof serializedErrorSchema>;

const readString = (error: Error, key: string): string | undefined => {
	const value: unknown = Reflect.get(error, key);
	return typeof value === "string" ? value : undefined;
};

const readNumber = (error: Error, key: string): number | undefined => {
	const value: unknown = Reflect.get(error, key);
	return typeof value === "number" ? value : undefined;
};

const readCode = (error: Error): string | number | undefined => readString(error, "code") ?? readNumber(error, "code");

export const serializeError = (error: unknown, depth = 0): SerializedError => {
	if (!(error instanceof Error)) {
		return { name: "NonError", message: String(error) };
	}
	const serialized: SerializedError = { name: error.name, message: error.message, stack: error.stack };
	const code = readCode(error);
	const errno = readNumber(error, "errno");
	const syscall = readString(error, "syscall");
	const address = readString(error, "address");
	const port = readNumber(error, "port");
	if (code !== undefined) serialized.code = code;
	if (errno !== undefined) serialized.errno = errno;
	if (syscall !== undefined) serialized.syscall = syscall;
	if (address !== undefined) serialized.address = address;
	if (port !== undefined) serialized.port = port;
	if (error instanceof AppError) {
		serialized.status = error.status;
		serialized.service = error.service;
		serialized.method = error.method;
		serialized.details = error.details;
	}

	if (error.cause !== undefined && depth < MAX_CAUSE_DEPTH) {
		serialized.cause = serializeError(error.cause, depth + 1);
	}
	if (error instanceof AggregateError && depth < MAX_CAUSE_DEPTH) {
		serialized.errors = error.errors.slice(0, MAX_AGGREGATED_ERRORS).map((inner: unknown) => serializeError(inner, depth + 1));
	}
	return serialized;
};
