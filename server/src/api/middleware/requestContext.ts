import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import type { ILogger } from "@/utils/logger.js";
import { getLogContext, runWithLogContext } from "@/utils/logContext.js";

const SERVICE_NAME = "RequestContext";
const REQUEST_ID_HEADER = "X-Request-Id";
const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;
const API_PREFIX = "/api/";
const SKIP_ACCESS_LOG = ["/api/v1/health"];

const shouldLogAccess = (url: string) => url.startsWith(API_PREFIX) && !SKIP_ACCESS_LOG.some((prefix) => url.startsWith(prefix));

export const requestContext =
	(logger: ILogger): RequestHandler =>
	(req, res, next) => {
		const incoming = req.get(REQUEST_ID_HEADER);
		const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
		res.set(REQUEST_ID_HEADER, requestId);
		const startedAt = process.hrtime.bigint();

		runWithLogContext({ requestId }, () => {
			const context = getLogContext() ?? { requestId };
			res.on("finish", () => {
				const path = req.originalUrl.split("?")[0] ?? req.originalUrl;
				if (!shouldLogAccess(path)) return;
				const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);
				runWithLogContext(context, () =>
					logger.debug({
						message: `${req.method} ${path} ${res.statusCode} ${durationMs}ms`,
						service: SERVICE_NAME,
						method: "access",
						details: { status: res.statusCode, durationMs },
					})
				);
			});
			next();
		});
	};
