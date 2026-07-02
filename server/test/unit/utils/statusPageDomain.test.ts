import { describe, expect, it } from "@jest/globals";
import { normalizeStatusPageDomain, resolveStatusPageDomainFromRequest } from "../../../src/utils/statusPageDomain.ts";

describe("statusPageDomain utils", () => {
	describe("normalizeStatusPageDomain", () => {
		it("returns null for empty values", () => {
			expect(normalizeStatusPageDomain("")).toBeNull();
			expect(normalizeStatusPageDomain("   ")).toBeNull();
			expect(normalizeStatusPageDomain(null)).toBeNull();
		});

		it("normalizes hostnames", () => {
			expect(normalizeStatusPageDomain("Status.Example.COM")).toBe("status.example.com");
			expect(normalizeStatusPageDomain("https://status.example.com/path")).toBe("status.example.com");
			expect(normalizeStatusPageDomain("status.example.com:443")).toBe("status.example.com");
		});
	});

	describe("resolveStatusPageDomainFromRequest", () => {
		it("prefers the query domain over the host header", () => {
			expect(resolveStatusPageDomainFromRequest("checkmate.example.com", "status.example.com")).toBe("status.example.com");
		});

		it("falls back to the host header", () => {
			expect(resolveStatusPageDomainFromRequest("status.example.com:8443", undefined)).toBe("status.example.com");
		});
	});
});
