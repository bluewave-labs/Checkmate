import rateLimit from "express-rate-limit";

export const generalApiLimiter = rateLimit({
	window: 60 * 1000,
	limit: 600,
	standardHeaders: true,
	legacyHeaders: false,
	ipv6Subnet: 64,
});

export const authApiLimiter = rateLimit({
	window: 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	ipv6Subnet: 64,
});
