import { AsyncLocalStorage } from "node:async_hooks";

export type LogContext = {
	reqId?: string;
	jobId?: string;
	jobType?: string;
};

export const logContext = new AsyncLocalStorage<LogContext>();

export const withLogContext = <T>(context: LogContext, fn: () => T): T => logContext.run({ ...logContext.getStore(), ...context }, fn);
