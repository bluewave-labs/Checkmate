import { AsyncLocalStorage } from "node:async_hooks";
import type { z } from "zod";
import type { logContextSchema } from "@/utils/logger.schema.js";

export type LogContext = z.infer<typeof logContextSchema>;

const storage = new AsyncLocalStorage<LogContext>();

export const runWithLogContext = <T>(context: LogContext, fn: () => T): T => storage.run({ ...storage.getStore(), ...context }, fn);

export const addLogContext = (context: LogContext) => {
	const store = storage.getStore();
	if (store) Object.assign(store, context);
};

export const getLogContext = (): LogContext | undefined => storage.getStore();
