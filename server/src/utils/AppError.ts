export interface AppErrorConfig {
	message?: string;
	service?: string;
	method?: string;
	details?: Record<string, unknown> | undefined;
}
export type ErrorDefinition = {
	readonly status: number;
	readonly description: string;
};

export const internalError: ErrorDefinition = {
	status: 500,
	description: "Internal server error",
};
export class AppError extends Error {
	readonly status: number;
	readonly definition: ErrorDefinition;
	readonly service: string;
	readonly method: string;
	readonly details: Record<string, unknown> | undefined;

	constructor(definition: ErrorDefinition, { message, service = "unknownService", method = "unknownMethod", details }: AppErrorConfig = {}) {
		super(message ?? definition.description);
		this.status = definition.status;
		this.definition = definition;
		this.service = service;
		this.method = method;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}
