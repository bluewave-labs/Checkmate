import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { createStatusPageDocumentCsp } from "../../../src/api/middleware/statusPageDocumentCsp.ts";

const makeRes = (): Response => {
	const res = {} as Response;
	res.append = jest.fn().mockReturnValue(res) as unknown as Response["append"];
	return res;
};

const cspMiddleware = createStatusPageDocumentCsp("http://localhost:10001");

const run = (req: Partial<Request>) => {
	const res = makeRes();
	const next = jest.fn() as unknown as NextFunction;
	cspMiddleware(req as Request, res, next);
	return { res, next };
};

const appendedValue = (res: Response): string => ((res.append as jest.Mock).mock.calls[0] as [string, string])[1];

describe("statusPageDocumentCsp", () => {
	it("appends a tightened CSP on the public status page path", () => {
		const { res, next } = run({ path: "/status/public/my-status-page", hostname: "localhost" });

		expect(res.append).toHaveBeenCalledTimes(1);
		const value = appendedValue(res);
		expect(value).toContain("img-src 'self' data:");
		expect(value).toContain("font-src 'self' data: https://fonts.gstatic.com");
		expect(value).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("does not restrict default-src or connect-src so the page can still reach the API", () => {
		const { res } = run({ path: "/status/public/my-status-page", hostname: "localhost" });

		const value = appendedValue(res);
		expect(value).not.toContain("default-src");
		expect(value).not.toContain("connect-src");
	});

	it("appends the CSP on a custom domain document at the host root", () => {
		const { res, next } = run({ path: "/", hostname: "status.example.com" });

		expect(res.append).toHaveBeenCalledTimes(1);
		expect(appendedValue(res)).toContain("img-src 'self' data:");
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("leaves the app's own non-public routes untouched", () => {
		const { res, next } = run({ path: "/status/create", hostname: "localhost" });

		expect(res.append).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});
});
