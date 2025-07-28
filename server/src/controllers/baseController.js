import { AppError } from "../service/infrastructure/errorService.js";

export const createCommonDependencies = (db, errorService, logger, stringService) => {
	return {
		db,
		errorService,
		logger,
		stringService,
	};
};

class BaseController {
	constructor({ db, logger, errorService, ...additionalDependencies }) {
		this.db = db;
		this.logger = logger;
		this.errorService = errorService;
		Object.assign(this, additionalDependencies);

		this.asyncHandler = (fn, serviceName, methodName) => {
			return async (req, res, next) => {
				try {
					await fn(req, res, next);
				} catch (error) {
					// Handle validation errors
					if (error.isJoi) {
						const validationError = this.errorService.createValidationError(error.message, error.details, serviceName, methodName);
						return next(validationError);
					}

					if (error.name === "ValidationError") {
						const validationError = this.errorService.createValidationError("Database validation failed", error.errors, serviceName, methodName);
						return next(validationError);
					}

					if (error.name === "CastError") {
						const notFoundError = this.errorService.createNotFoundError(
							"Invalid resource identifier",
							{ field: error.path, value: error.value },
							serviceName,
							methodName
						);
						return next(notFoundError);
					}

					if (error.code === "11000") {
						const conflictError = this.errorService.createConflictError("Resource already exists", {
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
						const appError = this.errorService.createError(error.message, error.status, serviceName, methodName, {
							originalError: error.message,
							stack: error.stack,
						});
						return next(appError);
					}

					// For unknown errors, create a server error
					const appError = this.errorService.createServerError(error.message || "An unexpected error occurred", {
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
	}
}
export default BaseController;
