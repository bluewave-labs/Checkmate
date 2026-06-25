import { describe, expect, it } from "@jest/globals";
import { isPublicStatusPageApiPath } from "../../../src/api/middleware/statusPagePublicApiPath.ts";

describe("isPublicStatusPageApiPath", () => {
	it("allows public resolve and slug routes", () => {
		expect(isPublicStatusPageApiPath("GET", "/api/v1/status-page/resolve")).toBe(true);
		expect(isPublicStatusPageApiPath("OPTIONS", "/api/v1/status-page/resolve")).toBe(true);
		expect(isPublicStatusPageApiPath("GET", "/api/v1/status-page/my-status-page")).toBe(true);
		expect(isPublicStatusPageApiPath("GET", "/api/v1/status-page/my-status-page?type=uptime")).toBe(true);
	});

	it("rejects authenticated and mutating status page routes", () => {
		expect(isPublicStatusPageApiPath("GET", "/api/v1/status-page/team")).toBe(false);
		expect(isPublicStatusPageApiPath("POST", "/api/v1/status-page")).toBe(false);
		expect(isPublicStatusPageApiPath("PUT", "/api/v1/status-page/64b1f2a3c4d5e6f7a8b9c0d1")).toBe(false);
		expect(isPublicStatusPageApiPath("DELETE", "/api/v1/status-page/64b1f2a3c4d5e6f7a8b9c0d1")).toBe(false);
		expect(isPublicStatusPageApiPath("GET", "/api/v1/monitors")).toBe(false);
	});
});
