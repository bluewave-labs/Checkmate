import { describe, expect, it, jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import type { NextFunction, Request, Response } from "express";
import { requestContext } from "../../../src/api/middleware/requestContext.ts";
import { addLogContext, getLogContext } from "../../../src/utils/logContext.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const setup = ({ url = "/api/v1/monitors?page=2", method = "GET", incomingId }: { url?: string; method?: string; incomingId?: string } = {}) => {
	const logger = createMockLogger();
	const headers: Record<string, string> = {};
	const req = {
		method,
		originalUrl: url,
		get: (name: string) => (name.toLowerCase() === "x-request-id" ? incomingId : undefined),
	} as unknown as Request;
	const res = Object.assign(new EventEmitter(), {
		statusCode: 200,
		set: (name: string, value: string) => {
			headers[name] = value;
		},
	}) as unknown as Response;
	let contextInNext: ReturnType<typeof getLogContext>;
	const next = jest.fn(() => {
		contextInNext = getLogContext();
	}) as unknown as NextFunction;
	requestContext(logger)(req, res, next);
	return { logger, headers, res, next, getContextInNext: () => contextInNext };
};

describe("requestContext", () => {
	it("generates a request ID when none is sent and returns it in the response header", () => {
		const { headers, next, getContextInNext } = setup();
		expect(next).toHaveBeenCalledTimes(1);
		expect(headers["X-Request-Id"]).toMatch(UUID_PATTERN);
		expect(getContextInNext()).toEqual({ requestId: headers["X-Request-Id"] });
	});

	it("accepts a well-formed incoming request ID", () => {
		const { headers, getContextInNext } = setup({ incomingId: "abc-123" });
		expect(headers["X-Request-Id"]).toBe("abc-123");
		expect(getContextInNext()).toEqual({ requestId: "abc-123" });
	});

	it.each([
		["one with unsafe characters", "abc\ninjected"],
		["one that is too long", "a".repeat(65)],
		["an empty one", ""],
	])("replaces %s with a generated ID", (_name, incomingId) => {
		const { headers } = setup({ incomingId });
		expect(headers["X-Request-Id"]).toMatch(UUID_PATTERN);
	});

	it("logs one access line at debug on finish, without the query string", () => {
		const { logger, res, headers } = setup();
		res.statusCode = 201;
		res.emit("finish");
		expect(logger.debug).toHaveBeenCalledTimes(1);
		expect(logger.debug).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringMatching(/^GET \/api\/v1\/monitors 201 \d+ms$/),
				service: "RequestContext",
				method: "access",
				details: { status: 201, durationMs: expect.any(Number) },
			})
		);
		expect(headers["X-Request-Id"]).toBeDefined();
	});

	it("logs the access line inside the request's context, including fields added later", () => {
		const logger = createMockLogger();
		let contextAtLog: ReturnType<typeof getLogContext>;
		logger.debug.mockImplementation(() => {
			contextAtLog = getLogContext();
		});
		const res = Object.assign(new EventEmitter(), { statusCode: 200, set: () => {} }) as unknown as Response;
		const req = { method: "GET", originalUrl: "/api/v1/monitors", get: () => "req-1" } as unknown as Request;
		requestContext(logger)(req, res, (() => addLogContext({ userId: "u1" })) as NextFunction);
		res.emit("finish");
		expect(contextAtLog).toEqual({ requestId: "req-1", userId: "u1" });
	});

	it.each([
		["health checks", "/api/v1/health"],
		["static assets", "/assets/index.js"],
		["the client config", "/config.js"],
	])("skips the access log for %s", (_name, url) => {
		const { logger, res } = setup({ url });
		res.emit("finish");
		expect(logger.debug).not.toHaveBeenCalled();
	});
});
