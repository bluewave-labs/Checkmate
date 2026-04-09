import { describe, expect, it, jest } from "@jest/globals";
import { AdvancedMatcher } from "../../../../src/service/infrastructure/network/AdvancedMatcher.ts";
import type { Monitor } from "../../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMockJmespath = () => ({
	search: jest.fn((data: any, expr: string) => {
		// Simple dot-path evaluation for tests
		return expr.split(".").reduce((acc: any, key: string) => acc?.[key], data);
	}),
});

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		useAdvancedMatching: false,
		jsonPath: undefined,
		matchMethod: undefined,
		expectedValue: undefined,
		...overrides,
	}) as Monitor;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("AdvancedMatcher", () => {
	describe("validate", () => {
		it("returns ok when advanced matching is disabled", () => {
			const matcher = new AdvancedMatcher(createMockJmespath() as any);
			const result = matcher.validate({ data: "test" }, makeMonitor({ useAdvancedMatching: false }));

			expect(result).toEqual({ ok: true, message: "Success" });
		});

		// ── jsonPath extraction ──────────────────────────────────────────

		describe("jsonPath extraction", () => {
			it("extracts value using jsonPath", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate({ status: "healthy" }, makeMonitor({ useAdvancedMatching: true, jsonPath: "status" }));

				expect(result).toEqual({ ok: true, message: "Success", extracted: "healthy" });
			});

			it("returns error when jsonPath evaluation throws", () => {
				const jmespath = {
					search: jest.fn().mockImplementation(() => {
						throw new Error("bad expression");
					}),
				};
				const matcher = new AdvancedMatcher(jmespath as any);

				const result = matcher.validate({ data: "test" }, makeMonitor({ useAdvancedMatching: true, jsonPath: "invalid[" }));

				expect(result).toEqual({ ok: false, message: "Error evaluating JSON path" });
			});
		});

		// ── expectedValue matching ───────────────────────────────────────

		describe("expectedValue with matchMethod", () => {
			it("matches with 'equal' method", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ status: "ok" },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "status", matchMethod: "equal", expectedValue: "ok" })
				);

				expect(result.ok).toBe(true);
			});

			it("fails with 'equal' method on mismatch", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ status: "error" },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "status", matchMethod: "equal", expectedValue: "ok" })
				);

				expect(result.ok).toBe(false);
				expect(result.message).toBe("Expected value did not match");
			});

			it("matches with 'include' method", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ msg: "server is healthy" },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "msg", matchMethod: "include", expectedValue: "healthy" })
				);

				expect(result.ok).toBe(true);
			});

			it("fails with 'include' method when substring not found", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ msg: "server is down" },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "msg", matchMethod: "include", expectedValue: "healthy" })
				);

				expect(result.ok).toBe(false);
			});

			it("matches with 'regex' method", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ code: "200" },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "code", matchMethod: "regex", expectedValue: "^2\\d{2}$" })
				);

				expect(result.ok).toBe(true);
			});

			it("fails with 'regex' method on mismatch", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ code: "500" },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "code", matchMethod: "regex", expectedValue: "^2\\d{2}$" })
				);

				expect(result.ok).toBe(false);
			});

			it("defaults to 'equal' comparison when matchMethod is undefined", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate({ val: "exact" }, makeMonitor({ useAdvancedMatching: true, jsonPath: "val", expectedValue: "exact" }));

				expect(result.ok).toBe(true);
			});

			it("defaults to 'equal' comparison for unknown matchMethod", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ val: "exact" },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "val", matchMethod: "unknown" as any, expectedValue: "exact" })
				);

				expect(result.ok).toBe(true);
			});

			it("compares entire payload when jsonPath is not set", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					"hello",
					makeMonitor({ useAdvancedMatching: true, jsonPath: undefined, matchMethod: "equal", expectedValue: "hello" })
				);

				expect(result.ok).toBe(true);
				expect(result.extracted).toBe("hello");
			});

			it("includes extracted value in result", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate(
					{ nested: { value: "42" } },
					makeMonitor({ useAdvancedMatching: true, jsonPath: "nested.value", matchMethod: "equal", expectedValue: "42" })
				);

				expect(result.extracted).toBe("42");
			});
		});

		// ── falsy value check (no expectedValue) ────────────────────────

		describe("falsy value check (no expectedValue)", () => {
			it("returns ok for truthy extracted value", () => {
				const matcher = new AdvancedMatcher(createMockJmespath() as any);
				const result = matcher.validate({ status: "up" }, makeMonitor({ useAdvancedMatching: true, jsonPath: "status" }));

				expect(result.ok).toBe(true);
				expect(result.extracted).toBe("up");
			});

			it("returns not ok for false", () => {
				const jmespath = { search: jest.fn().mockReturnValue(false) };
				const matcher = new AdvancedMatcher(jmespath as any);

				const result = matcher.validate({}, makeMonitor({ useAdvancedMatching: true, jsonPath: "missing" }));

				expect(result.ok).toBe(false);
				expect(result.message).toBe("Extracted value is falsy");
			});

			it("returns not ok for string 'false'", () => {
				const jmespath = { search: jest.fn().mockReturnValue("false") };
				const matcher = new AdvancedMatcher(jmespath as any);

				const result = matcher.validate({}, makeMonitor({ useAdvancedMatching: true, jsonPath: "field" }));

				expect(result.ok).toBe(false);
			});

			it("returns not ok for undefined", () => {
				const jmespath = { search: jest.fn().mockReturnValue(undefined) };
				const matcher = new AdvancedMatcher(jmespath as any);

				const result = matcher.validate({}, makeMonitor({ useAdvancedMatching: true, jsonPath: "field" }));

				expect(result.ok).toBe(false);
			});

			it("returns not ok for null", () => {
				const jmespath = { search: jest.fn().mockReturnValue(null) };
				const matcher = new AdvancedMatcher(jmespath as any);

				const result = matcher.validate({}, makeMonitor({ useAdvancedMatching: true, jsonPath: "field" }));

				expect(result.ok).toBe(false);
			});

			it("returns ok for zero (not in falsy list)", () => {
				const jmespath = { search: jest.fn().mockReturnValue(0) };
				const matcher = new AdvancedMatcher(jmespath as any);

				const result = matcher.validate({}, makeMonitor({ useAdvancedMatching: true, jsonPath: "field" }));

				expect(result.ok).toBe(true);
			});

			it("returns ok for empty string (not in falsy list)", () => {
				const jmespath = { search: jest.fn().mockReturnValue("") };
				const matcher = new AdvancedMatcher(jmespath as any);

				const result = matcher.validate({}, makeMonitor({ useAdvancedMatching: true, jsonPath: "field" }));

				expect(result.ok).toBe(true);
			});
		});
	});
});
