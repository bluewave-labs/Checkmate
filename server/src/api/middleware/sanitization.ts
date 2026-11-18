import type { Request, Response, NextFunction } from "express";
import DOMPurify from "isomorphic-dompurify";

// Admin-only notification template fields. They legitimately contain angle brackets:
// Discord mentions (<@user>, <@&role>) and {{variables}}. DOMPurify would
// entity-encode them and break mentions. They are rendered by React (auto-escaped)
// and sent to chat/email as plain text, never as HTML.
const RAW_TEMPLATE_KEYS = ["customTitle", "customBody", "pingContent"];

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
		if (RAW_TEMPLATE_KEYS.includes(key)) {
			sanitized[key] = value;
		} else if (typeof value === "string") {
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
		const sanitized = Object.fromEntries(
			Object.entries(req.query).map(([key, value]) => [key, typeof value === "string" ? sanitizeInput(value, options) : value])
		);
		Object.defineProperty(req, "query", { value: sanitized, writable: true, configurable: true, enumerable: true });
		next();
	};
};
