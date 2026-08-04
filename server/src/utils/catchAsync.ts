import type { NextFunction, Request, RequestHandler, Response } from "express";
type AsyncRequestHandler = (req: Request, res: Response) => Promise<unknown>;

/**
 * Wraps an async route handler so that any error it throws or any promise it
 * rejects is passed to Express's error middleware (`handleErrors`).  Every async controller method must be wrapped.
 */
export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
	const wrappedHandler = (req: Request, res: Response, next: NextFunction) => {
		fn(req, res).catch(next);
	};

	return wrappedHandler;
};
