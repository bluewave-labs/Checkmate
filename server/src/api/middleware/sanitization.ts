import type { Request, Response, NextFunction } from "express";
import DOMPurify from "isomorphic-dompurify";

export function sanitizeInput(input: string, options?: object): string;
export function sanitizeInput(input: unknown, options?: object): unknown;
export function sanitizeInput(input: unknown, options = {}): unknown {
	if (typeof input !== "string") {
		return input;
	}

	// Default configuration - remove all HTML tags and attributes
	const defaultConfig = {
		ALLOWED_TAGS: [] as string[],
		ALLOWED_ATTR: [] as string[],
		KEEP_CONTENT: true,
		...options,
	};

	return DOMPurify.sanitize(input, defaultConfig);
}

export const sanitizeObject = (obj: unknown, options = {}): unknown => {
	if (typeof obj !== "object" || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeObject(item, options));
	}

	const sanitized: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === "string") {
			sanitized[key] = sanitizeInput(value, options);
		} else if (typeof value === "object" && value !== null) {
			sanitized[key] = sanitizeObject(value, options);
		} else {
			sanitized[key] = value;
		}
	}

	return sanitized;
};

export const sanitizeBody = (options = {}): ((req: Request, res: Response, next: NextFunction) => void) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (req.body && typeof req.body === "object") {
			req.body = sanitizeObject(req.body, options);
		}
		next();
	};
};

export const sanitizeQuery = (options = {}): ((req: Request, res: Response, next: NextFunction) => void) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (req.query && typeof req.query === "object") {
			for (const key of Object.keys(req.query)) {
				const value = req.query[key];
				if (typeof value === "string") {
					req.query[key] = sanitizeInput(value, options);
				}
			}
		}
		next();
	};
};
