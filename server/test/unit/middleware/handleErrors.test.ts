import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
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

	it("falls back to 500 for unknown errors", () => {
		const res = makeRes();
		handleErrors(logger)(new Error("boom"), {} as Request, res, (() => {}) as NextFunction);
		expect(res.status).toHaveBeenCalledWith(500);
	});
});
