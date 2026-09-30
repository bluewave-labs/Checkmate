import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { sanitizeBody, sanitizeInput, sanitizeObject, sanitizeQuery } from "../../../src/api/middleware/sanitization.ts";

// Express 5 exposes req.query as a getter on the request prototype that re-parses the URL on
// every read, so writes into the returned object are lost. The middleware must shadow the
// getter with an own property, which is what this fixture checks.
const makeExpress5Request = (query: Record<string, unknown>) => {
	const proto = {};
	Object.defineProperty(proto, "query", {
		get: () => ({ ...query }),
		configurable: true,
		enumerable: true,
	});
	return Object.create(proto) as Request;
};

describe("sanitizeInput", () => {
	it("strips html tags and keeps the text content", () => {
		expect(sanitizeInput('<script>alert("x")</script>hello <b>bold</b>')).toBe("hello bold");
	});

	it("returns non-string values unchanged", () => {
		expect(sanitizeInput(42)).toBe(42);
		expect(sanitizeInput(null)).toBeNull();
		expect(sanitizeInput(undefined)).toBeUndefined();
	});
});

describe("sanitizeObject", () => {
	it("sanitizes nested strings and arrays, leaving other values untouched", () => {
		const result = sanitizeObject({
			name: "<img src=x onerror=alert(1)>Alice",
			count: 3,
			active: true,
			items: [{ note: "<i>one</i>" }, { note: "two" }],
			nested: { note: "<p>hi</p>" },
		});

		expect(result).toEqual({
			name: "Alice",
			count: 3,
			active: true,
			items: [{ note: "one" }, { note: "two" }],
			nested: { note: "hi" },
		});
	});

	it("returns primitives and null unchanged", () => {
		expect(sanitizeObject("<b>x</b>")).toBe("<b>x</b>");
		expect(sanitizeObject(null)).toBeNull();
	});
});

describe("sanitizeBody middleware", () => {
	it("replaces req.body with a sanitized copy and calls next", () => {
		const req = { body: { name: "<b>Alice</b>", nested: { note: "<i>x</i>" } } } as unknown as Request;
		const next = jest.fn() as unknown as NextFunction;

		sanitizeBody()(req, {} as Response, next);

		expect(req.body).toEqual({ name: "Alice", nested: { note: "x" } });
		expect(next).toHaveBeenCalledWith();
	});

	it("leaves req.body alone when there is no body", () => {
		const req = {} as unknown as Request;
		const next = jest.fn() as unknown as NextFunction;

		sanitizeBody()(req, {} as Response, next);

		expect(req.body).toBeUndefined();
		expect(next).toHaveBeenCalledWith();
	});
});

describe("sanitizeQuery middleware", () => {
	it("sanitizes string values so that later reads of req.query see them", () => {
		const req = makeExpress5Request({ filter: "<script>x</script>term", page: "2" });
		const next = jest.fn() as unknown as NextFunction;

		sanitizeQuery()(req, {} as Response, next);

		expect(req.query).toEqual({ filter: "term", page: "2" });
		expect(req.query).toEqual({ filter: "term", page: "2" }); // stable across reads
		expect(next).toHaveBeenCalledWith();
	});

	it("does not sanitize inside array values", () => {
		const req = makeExpress5Request({ type: ["<b>http</b>", "ping"] });
		const next = jest.fn() as unknown as NextFunction;

		sanitizeQuery()(req, {} as Response, next);

		expect(req.query).toEqual({ type: ["<b>http</b>", "ping"] });
	});

	it("handles an empty query", () => {
		const req = makeExpress5Request({});
		const next = jest.fn() as unknown as NextFunction;

		sanitizeQuery()(req, {} as Response, next);

		expect(req.query).toEqual({});
		expect(next).toHaveBeenCalledWith();
	});
});
