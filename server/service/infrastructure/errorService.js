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

class ValidationError extends AppError {
	constructor(message, details = null, service = null, method = null) {
		super(message, 422, service, method, details);
	}
}

class AuthenticationError extends AppError {
	constructor(message, details = null, service = null, method = null) {
		super(message, 401, service, method, details);
	}
}

class AuthorizationError extends AppError {
	constructor(message, details = null, service = null, method = null) {
		super(message, 403, service, method, details);
	}
}

class NotFoundError extends AppError {
	constructor(message, details = null, service = null, method = null) {
		super(message, 404, service, method, details);
	}
}

class ConflictError extends AppError {
	constructor(message, details = null, service = null, method = null) {
		super(message, 409, service, method, details);
	}
}

class DatabaseError extends AppError {
	constructor(message, details = null, service = null, method = null) {
		super(message, 500, service, method, details);
	}
}

class BadRequestError extends AppError {
	constructor(message, details = null, service = null, method = null) {
		super(message, 400, service, method, details);
	}
}

const SERVICE_NAME = "ErrorService";
class ErrorService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor() {}

	createError = (message, status = 500, service = null, method = null, details = null) => {
		return new AppError(message, status, service, method, details);
	};

	createValidationError = (message, details = null, service = null, method = null) => {
		return new ValidationError(message, details, service, method);
	};

	createAuthenticationError = (message = "Unauthorized", details = null, service = null, method = null) => {
		return new AuthenticationError(message, details, service, method);
	};

	createAuthorizationError = (message, details = null, service = null, method = null) => {
		return new AuthorizationError(message, details, service, method);
	};

	createNotFoundError = (message, details = null, service = null, method = null) => {
		return new NotFoundError(message, details, service, method);
	};

	createConflictError = (message, details = null, service = null, method = null) => {
		return new ConflictError(message, details, service, method);
	};

	createDatabaseError = (message, details = null, service = null, method = null) => {
		return new DatabaseError(message, details, service, method);
	};

	createServerError = (message, details = null, service = null, method = null) => {
		return this.createError(message, 500, service, method, details);
	};

	createBadRequestError = (message = "BadRequest", details = null, service = null, method = null) => {
		return new BadRequestError(message, details, service, method);
	};
}

export default ErrorService;

export const asyncHandler = (fn, serviceName, methodName) => {
	return async (req, res, next) => {
		try {
			await fn(req, res, next);
		} catch (error) {
			// Handle validation errors
			if (error.isJoi) {
				const validationError = this.createValidationError(error.message, error.details, serviceName, methodName);
				return next(validationError);
			}

			if (error.name === "ValidationError") {
				const validationError = this.createValidationError("Database validation failed", error.errors, serviceName, methodName);
				return next(validationError);
			}

			if (error.name === "CastError") {
				const notFoundError = this.createNotFoundError(
					"Invalid resource identifier",
					{ field: error.path, value: error.value },
					serviceName,
					methodName
				);
				return next(notFoundError);
			}

			if (error.code === "11000") {
				const conflictError = this.createConflictError("Resource already exists", {
					originalError: error.message,
					code: error.code,
				});
				conflictError.service = serviceName;
				conflictError.method = methodName;
				return next(conflictError);
			}

			if (error instanceof AppError) {
				error.service = error.service || serviceName;
				error.method = error.method || methodName;
				return next(error);
			}

			if (error.status) {
				const appError = this.createError(error.message, error.status, serviceName, methodName, {
					originalError: error.message,
					stack: error.stack,
				});
				return next(appError);
			}

			// For unknown errors, create a server error
			const appError = this.createServerError(error.message || "An unexpected error occurred", {
				originalError: error.message,
				stack: error.stack,
			});
			appError.service = serviceName;
			appError.method = methodName;
			appError.stack = error.stack; // Preserve original stack
			return next(appError);
		}
	};
};
