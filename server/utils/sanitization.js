import { JSDOM } from "jsdom";
import DOMPurify from "isomorphic-dompurify";

// Initialize DOMPurify with jsdom
const window = new JSDOM("").window;
const purify = DOMPurify(window);

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} The sanitized string
 */
export const sanitizeInput = (input, options = {}) => {
	if (typeof input !== "string") {
		return input;
	}

	// Default configuration - remove all HTML tags and attributes
	const defaultConfig = {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
		KEEP_CONTENT: true,
		...options,
	};

	return purify.sanitize(input, defaultConfig);
};

/**
 * Sanitizes an object recursively
 * @param {Object} obj - The object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} The sanitized object
 */
export const sanitizeObject = (obj, options = {}) => {
	if (typeof obj !== "object" || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeObject(item, options));
	}

	const sanitized = {};
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

/**
 * Express middleware for sanitizing request body
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware function
 */
export const sanitizeBody = (options = {}) => {
	return (req, res, next) => {
		if (req.body && typeof req.body === "object") {
			req.body = sanitizeObject(req.body, options);
		}
		next();
	};
};

/**
 * Express middleware for sanitizing query parameters
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware function
 */
export const sanitizeQuery = (options = {}) => {
	return (req, res, next) => {
		if (req.query && typeof req.query === "object") {
			req.query = sanitizeObject(req.query, options);
		}
		next();
	};
};