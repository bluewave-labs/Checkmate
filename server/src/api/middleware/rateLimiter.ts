import type { ErrorBody } from "@/api/routes/openapiHelpers.js";
import rateLimit, { type Options } from "express-rate-limit";

export const tooManyRequests: Options["handler"] = (_req, res) => {
	const body: ErrorBody = { status: 429, msg: "Too many requests, please try again later." };
	res.status(body.status).json(body);
};

export const generalApiLimiter = (devMode: boolean) =>
	rateLimit({
		windowMs: 60 * 1000,
		limit: 600,
		standardHeaders: true,
		legacyHeaders: false,
		ipv6Subnet: 64,
		skip: () => devMode,
		handler: tooManyRequests,
	});

// Separate from authApiLimiter because a single sign-in spends two requests here, and that limiter
// is 15/min shared across every client behind a reverse proxy (trust proxy is not set, so they all
// key to the proxy's address). Tripping it mid-flow would strand users at the provider.
export const ssoApiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 60,
	standardHeaders: true,
	legacyHeaders: false,
	ipv6Subnet: 64,
	handler: tooManyRequests,
});

export const authApiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 15,
	standardHeaders: true,
	legacyHeaders: false,
	ipv6Subnet: 64,
	handler: tooManyRequests,
});
