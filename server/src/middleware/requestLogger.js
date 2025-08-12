import { logger } from "../utils/logger.js";

const requestLogger = (req, res, next) => {
	if (process.env.LOG_REQUESTS === "true") {
		const start = process.hrtime.bigint();
		const { method, url, ip } = req;
		const userAgent = req.get("User-Agent") || "Unknown";
		const requestId = Math.random().toString(36).substring(2, 11);

		const baseDetails = { requestId, method, url, ip, userAgent, headers: req.headers };

		logger.info({
			message: `${method} ${url}`,
			service: "RequestLogger",
			method: "incoming",
			details: baseDetails,
		});

		res.on("finish", () => {
			const end = process.hrtime.bigint();
			const duration = Number(end - start) / 1000000; // Convert to milliseconds
			const { statusCode } = res;
			const contentLength = res.get("Content-Length") || 0;

			const logLevel = statusCode >= 400 ? "warn" : "info";

			logger[logLevel]({
				message: `${method} ${url} ${statusCode}`,
				service: "RequestLogger",
				method: "completed",
				details: {
					...baseDetails,
					statusCode,
					duration: `${duration.toFixed(2)}ms`,
					contentLength: `${contentLength} bytes`,
				},
			});
		});
	}

	next();
};

export { requestLogger };
