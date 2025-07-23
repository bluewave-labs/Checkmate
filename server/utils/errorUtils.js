class AppError extends Error {
	constructor(message, status = 500, service = null, method = null, details = null) {
		super(message);
		this.status = status;
		this.service = service;
		this.method = method;
		this.details = details;

		Error.captureStackTrace(this, this.constructor);
	}
}

export const createError = (message, status = 500, service = null, method = null, details = null) => {
	return new AppError(message, status, service, method, details);
};

export const createValidationError = (message, details = null, service = null, method = null) => {
	return createError(message, 422, service, method, details);
};

export const createAuthError = (message, details = null, service = null, method = null) => {
	return createError(message, 401, service, method, details);
};

export const createForbiddenError = (message, details = null, service = null, method = null) => {
	return createError(message, 403, service, method, details);
};

export const createNotFoundError = (message, details = null, service = null, method = null) => {
	return createError(message, 404, service, method, details);
};

export const createConflictError = (message, details = null, service = null, method = null) => {
	return createError(message, 409, service, method, details);
};

export const createServerError = (message, details = null, service = null, method = null) => {
	return createError(message, 500, service, method, details);
};

export const asyncHandler = (fn, serviceName, methodName) => {
	return async (req, res, next) => {
		try {
			await fn(req, res, next);
		} catch (error) {
			// Handle validation errors
			if (error.isJoi || error.name === "ValidationError") {
				const validationError = createValidationError(error.message, error.details, serviceName, methodName);
				return next(validationError);
			}

			if (error instanceof AppError) {
				error.service = error.service || serviceName;
				error.method = error.method || methodName;
				return next(error);
			}

			if (error.code === "23505") {
				const appError = createConflictError("Resource already exists", {
					originalError: error.message,
					code: error.code,
				});
				appError.service = serviceName;
				appError.method = methodName;
				return next(appError);
			}

			// For unknown errors, create a server error
			const appError = createServerError(error.message || "An unexpected error occurred", { originalError: error.message, stack: error.stack });
			appError.service = serviceName;
			appError.method = methodName;
			appError.stack = error.stack; // Preserve original stack

			return next(appError);
		}
	};
};
