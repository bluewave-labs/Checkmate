import rateLimit from "express-rate-limit";

export const generalApiLimiter = (devMode: boolean) =>
	rateLimit({
		windowMs: 60 * 1000,
		limit: 600,
		standardHeaders: true,
		legacyHeaders: false,
		ipv6Subnet: 64,
		skip: () => devMode,
	});

export const authApiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 15,
	standardHeaders: true,
	legacyHeaders: false,
	ipv6Subnet: 64,
});
