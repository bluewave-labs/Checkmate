import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { z } from "zod";
import { handleErrors } from "../../../src/api/middleware/handleErrors.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const logger = createMockLogger();

const makeRes = (): Response => {
	const res = {} as Response;
	res.status = jest.fn().mockReturnValue(res) as unknown as Response["status"];
	res.json = jest.fn().mockReturnValue(res) as unknown as Response["json"];
	return res;
};

describe("handleErrors", () => {
	it("maps a multer file-size violation to 413 Payload Too Large", () => {
		const res = makeRes();
		handleErrors(logger)(new MulterError("LIMIT_FILE_SIZE", "profileImage"), {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(413);
	});

	it("maps other multer errors to 400", () => {
		const res = makeRes();
		handleErrors(logger)(new MulterError("LIMIT_UNEXPECTED_FILE", "profileImage"), {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(400);
	});

	it("preserves AppError status codes", () => {
		const res = makeRes();
		handleErrors(logger)(new AppError({ status: 415, message: "bad image" }), {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(415);
	});

	it("honours the status of a body-parser error so malformed JSON is a 400 and an oversized body a 413", () => {
		const res = makeRes();
		const malformed = Object.assign(new Error("Unexpected token } in JSON"), { status: 400, type: "entity.parse.failed" });
		handleErrors(logger)(malformed, {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ status: 400, msg: "Unexpected token } in JSON" });

		const tooLarge = makeRes();
		handleErrors(logger)(
			Object.assign(new Error("request entity too large"), { status: 413, type: "entity.too.large" }),
			{} as Request,
			tooLarge,
			(() => {}) as NextFunction
		);
		expect(tooLarge.status).toHaveBeenCalledWith(413);
	});

	it("does not honour a non-client status on an unknown error", () => {
		const res = makeRes();
		handleErrors(logger)(Object.assign(new Error("upstream"), { status: 503 }), {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(500);
	});

	it("falls back to 500 for unknown errors", () => {
		const res = makeRes();
		handleErrors(logger)(new Error("boom"), {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(500);
	});

	it("maps a ZodError to 400 with a readable message and logs at warn", () => {
		const res = makeRes();
		const localLogger = createMockLogger();
		const error = z.object({ name: z.string().min(1) }).safeParse({ name: "" }).error!;
		handleErrors(localLogger)(error, {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 400, msg: expect.stringContaining("name:") }));
		expect(localLogger.warn).toHaveBeenCalledWith(
			expect.objectContaining({ errorService: "validation", status: 400, details: { issues: expect.any(Array) } }),
			"Request failed"
		);
		expect(localLogger.error).not.toHaveBeenCalled();
	});

	it("logs the request method and path, without the query string", () => {
		const localLogger = createMockLogger();
		const req = { method: "GET", originalUrl: "/api/v1/monitors/certificate/abc123?token=secret" } as Request;
		handleErrors(localLogger)(new Error("connect ETIMEDOUT"), req, makeRes(), (() => {}) as NextFunction);
		expect(localLogger.error).toHaveBeenCalledWith(
			expect.objectContaining({ errorService: "unknownService", status: 500, request: "GET /api/v1/monitors/certificate/abc123" }),
			"Request failed"
		);
	});

	it("redacts the heartbeat ping key from the logged request and keeps the slug", () => {
		const localLogger = createMockLogger();
		const req = { method: "GET", originalUrl: "/api/v1/heartbeat/secret-key/backup/fail" } as Request;
		handleErrors(localLogger)(new Error("boom"), req, makeRes(), (() => {}) as NextFunction);
		expect(localLogger.error).toHaveBeenCalledWith(
			expect.objectContaining({ request: "GET /api/v1/heartbeat/[Redacted]/backup/fail" }),
			"Request failed"
		);
	});

	it("keeps existing details alongside the request", () => {
		const localLogger = createMockLogger();
		const req = { method: "POST", originalUrl: "/api/v1/monitors" } as Request;
		const error = z.object({ name: z.string().min(1) }).safeParse({ name: "" }).error!;
		handleErrors(localLogger)(error, req, makeRes(), (() => {}) as NextFunction);
		expect(localLogger.warn).toHaveBeenCalledWith(
			expect.objectContaining({ request: "POST /api/v1/monitors", details: expect.objectContaining({ issues: expect.any(Array) }) }),
			"Request failed"
		);
	});

	it("logs 4xx AppErrors at warn and 5xx at error", () => {
		const localLogger = createMockLogger();
		handleErrors(localLogger)(new AppError({ status: 404, message: "missing" }), {} as Request, makeRes(), (() => {}) as NextFunction);
		expect(localLogger.warn).toHaveBeenCalledTimes(1);
		expect(localLogger.error).not.toHaveBeenCalled();
		handleErrors(localLogger)(new AppError({ status: 500, message: "boom" }), {} as Request, makeRes(), (() => {}) as NextFunction);
		expect(localLogger.error).toHaveBeenCalledTimes(1);
	});
});
