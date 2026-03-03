export interface AppErrorConfig {
	message: string;
	status?: number;
	service?: string | null;
	method?: string | null;
	details?: unknown;
}

export class AppError extends Error {
	private status: number;
	private service: string | null;
	private method: string | null;
	private details: unknown;

	constructor({ message, status = 500, service = null, method = null, details = null }: AppErrorConfig) {
		super(message);
		this.status = status;
		this.service = service;
		this.method = method;
		this.details = details;

		Error.captureStackTrace(this, this.constructor);
	}
}
