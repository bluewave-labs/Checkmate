export interface AppErrorConfig {
	message?: string;
	status?: number;
	service?: string;
	method?: string;
	details?: Record<string, unknown> | undefined;
}

export class AppError extends Error {
	readonly status: number;
	readonly service: string;
	readonly method: string;
	readonly details: Record<string, unknown> | undefined;

	constructor({ message, status = 500, service = "unknownService", method = "unknownMethod", details = undefined }: AppErrorConfig) {
		super(message);
		this.status = status;
		this.service = service;
		this.method = method;
		this.details = details;

		Error.captureStackTrace(this, this.constructor);
	}
}
