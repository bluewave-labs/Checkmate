import { describe, expect, it } from "@jest/globals";
import { APP_CSP_DIRECTIVES } from "../../../src/api/middleware/appCsp.ts";

const directive = (name: string): string[] => (APP_CSP_DIRECTIVES as Record<string, string[]>)[name] ?? [];

describe("APP_CSP_DIRECTIVES", () => {
	it("allows blob: images so an upload preview renders", () => {
		expect(directive("img-src")).toContain("blob:");
	});

	it("allows blob: connections so the upload can read the picked file back", () => {
		// Without an explicit connect-src the XHR falls back to default-src 'self',
		// which does not cover blob:, and the logo is dropped on submit.
		expect(directive("connect-src")).toContain("blob:");
	});

	it("keeps blob: out of script-src", () => {
		expect(directive("script-src")).not.toContain("blob:");
	});

	it("still restricts images to self, data:, and the badge host", () => {
		expect(directive("img-src")).toEqual(["'self'", "data:", "blob:", "https://img.shields.io"]);
	});

	it("does not widen connect-src beyond self and blob:", () => {
		expect(directive("connect-src")).toEqual(["'self'", "blob:"]);
	});
});
