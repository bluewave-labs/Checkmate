import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import type { Options } from "express-rate-limit";
import { tooManyRequests } from "../../../src/api/middleware/rateLimiter.ts";

const makeRes = (): Response => {
	const res = {} as Response;
	res.status = jest.fn().mockReturnValue(res) as unknown as Response["status"];
	res.json = jest.fn().mockReturnValue(res) as unknown as Response["json"];
	return res;
};

describe("rateLimiter", () => {
	it("answers a rate-limited request with a 429 in the error envelope", () => {
		const res = makeRes();
		tooManyRequests({} as Request, res, (() => {}) as NextFunction, {} as Options);
		expect(res.status).toHaveBeenCalledWith(429);
		expect(res.json).toHaveBeenCalledWith({ status: 429, msg: "Too many requests, please try again later." });
	});
});
