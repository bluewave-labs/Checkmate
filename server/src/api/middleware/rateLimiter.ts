import { ErrorBody } from "@/api/routes/openapiHelpers.js";
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

export const authApiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 15,
	standardHeaders: true,
	legacyHeaders: false,
	ipv6Subnet: 64,
	handler: tooManyRequests,
});
