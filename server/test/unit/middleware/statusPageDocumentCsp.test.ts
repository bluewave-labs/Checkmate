import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { statusPageDocumentCsp } from "../../../src/api/middleware/statusPageDocumentCsp.ts";

const makeRes = (): Response => {
	const res = {} as Response;
	res.append = jest.fn().mockReturnValue(res) as unknown as Response["append"];
	return res;
};

describe("statusPageDocumentCsp", () => {
	it("appends a tightened CSP on the public status page document", () => {
		const res = makeRes();
		const next = jest.fn() as unknown as NextFunction;
		statusPageDocumentCsp({ path: "/status/public/my-status-page" } as Request, res, next);

		expect(res.append).toHaveBeenCalledTimes(1);
		const [header, value] = (res.append as jest.Mock).mock.calls[0] as [string, string];
		expect(header).toBe("Content-Security-Policy");
		expect(value).toContain("img-src 'self' data:");
		expect(value).toContain("font-src 'self' data: https://fonts.gstatic.com");
		expect(value).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("leaves other routes untouched", () => {
		const res = makeRes();
		const next = jest.fn() as unknown as NextFunction;
		statusPageDocumentCsp({ path: "/status/create" } as Request, res, next);

		expect(res.append).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});
});
