import { describe, expect, it } from "@jest/globals";
import { createStatusPageBodyValidation, getStatusPageQueryValidation } from "../../../src/api/validation/statusPageValidation.ts";
import { StatusPageRanges } from "../../../src/domain/status-pages/status-page.type.ts";

const baseCreateBody = (overrides: Record<string, unknown> = {}) => ({
	type: "uptime",
	companyName: "Test Co",
	url: "my-status-page",
	monitors: ["0123456789abcdef01234567"],
	isPublished: true,
	showUptimePercentage: true,
	...overrides,
});

describe("createStatusPageBodyValidation", () => {
	it("accepts a valid body without customCSS", () => {
		const result = createStatusPageBodyValidation.safeParse(baseCreateBody());
		expect(result.success).toBe(true);
	});

	it("accepts and preserves customCSS", () => {
		const customCSS = ".status-page > footer { display: none; }";
		const result = createStatusPageBodyValidation.safeParse(baseCreateBody({ customCSS }));
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.customCSS).toBe(customCSS);
		}
	});

	it("accepts an empty customCSS so it can be cleared", () => {
		const result = createStatusPageBodyValidation.safeParse(baseCreateBody({ customCSS: "" }));
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.customCSS).toBe("");
		}
	});

	it("rejects customCSS over the maximum length", () => {
		const result = createStatusPageBodyValidation.safeParse(baseCreateBody({ customCSS: "a".repeat(100001) }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([expect.objectContaining({ message: "Custom CSS must be at most 100000 characters", path: ["customCSS"] })])
			);
		}
	});

	it("rejects a non-string customCSS", () => {
		const result = createStatusPageBodyValidation.safeParse(baseCreateBody({ customCSS: 42 }));
		expect(result.success).toBe(false);
	});

	it("rejects customCSS that references an external resource", () => {
		const result = createStatusPageBodyValidation.safeParse(baseCreateBody({ customCSS: 'body{background:url("https://evil.example/beacon")}' }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ message: "Custom CSS cannot reference external URLs or use @import", path: ["customCSS"] }),
				])
			);
		}
	});
});

describe("getStatusPageQueryValidation", () => {
	it("defaults range to latest when absent", () => {
		const result = getStatusPageQueryValidation.safeParse({ type: "uptime" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.range).toBe("latest");
		}
	});

	it("accepts every supported range", () => {
		for (const range of StatusPageRanges) {
			const result = getStatusPageQueryValidation.safeParse({ type: "uptime", range });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.range).toBe(range);
			}
		}
	});

	it("rejects an unsupported range", () => {
		const result = getStatusPageQueryValidation.safeParse({ type: "uptime", range: "45d" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["range"] })]));
		}
	});
});
