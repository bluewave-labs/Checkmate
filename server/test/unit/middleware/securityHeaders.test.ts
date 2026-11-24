import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { createSecurityHeaders } from "../../../src/api/middleware/securityHeaders.js";

const makeRes = (): Response => {
	const headers = new Map<string, string>();
	const res = {} as Response;
	res.setHeader = jest.fn((name: string, value: string) => {
		headers.set(name, value);
		return res;
	}) as unknown as Response["setHeader"];
	res.getHeader = jest.fn((name: string) => headers.get(name)) as unknown as Response["getHeader"];
	res.removeHeader = jest.fn((name: string) => {
		headers.delete(name);
	}) as unknown as Response["removeHeader"];
	return res;
};

const cspHeader = (res: Response): string => String(res.getHeader("Content-Security-Policy"));

describe("securityHeaders", () => {
	it("allows the blob: workers MapLibre spawns", () => {
		const res = makeRes();
		const next = jest.fn() as unknown as NextFunction;
		createSecurityHeaders()({} as Request, res, next);

		expect(cspHeader(res)).toContain("worker-src 'self' blob:");
		expect(next).toHaveBeenCalledTimes(1);
	});

	it("allows the Carto basemap endpoints the geo map fetches", () => {
		const res = makeRes();
		const next = jest.fn() as unknown as NextFunction;
		createSecurityHeaders()({} as Request, res, next);

		const csp = cspHeader(res);
		expect(csp).toContain("connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com");
		expect(csp).toContain("img-src 'self' data: blob: https://img.shields.io https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com");
	});
});
