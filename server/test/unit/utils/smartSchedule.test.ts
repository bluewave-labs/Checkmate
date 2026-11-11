import { describe, expect, it } from "@jest/globals";
import { deriveSmartUrl, isSmartDue, SMART_INTERVAL_MS, SMART_MAX_TIMEOUT_MS, smartTimeoutMs } from "../../../src/domain/storage/smart-schedule.ts";

describe("deriveSmartUrl", () => {
	it("appends /smart to a metrics URL", () => {
		expect(deriveSmartUrl("http://10.0.0.5:59232/api/v1/metrics")).toBe("http://10.0.0.5:59232/api/v1/metrics/smart");
	});

	it("keeps a path prefix, such as Capture behind a reverse proxy", () => {
		expect(deriveSmartUrl("https://hosts.example.com/nas/api/v1/metrics")).toBe("https://hosts.example.com/nas/api/v1/metrics/smart");
	});

	it("accepts a trailing slash", () => {
		expect(deriveSmartUrl("http://host:59232/api/v1/metrics/")).toBe("http://host:59232/api/v1/metrics/smart");
	});

	it("keeps the query string", () => {
		expect(deriveSmartUrl("http://host:59232/api/v1/metrics?token=abc")).toBe("http://host:59232/api/v1/metrics/smart?token=abc");
	});

	it("returns null for a URL that does not point at the metrics endpoint", () => {
		expect(deriveSmartUrl("http://host:59232/")).toBeNull();
		expect(deriveSmartUrl("http://host:59232/api/v1/metrics/cpu")).toBeNull();
		expect(deriveSmartUrl("http://host:59232/custom/endpoint")).toBeNull();
	});

	it("returns null for a missing or invalid URL", () => {
		expect(deriveSmartUrl(undefined)).toBeNull();
		expect(deriveSmartUrl("")).toBeNull();
		expect(deriveSmartUrl("not a url/api/v1/metrics")).toBeNull();
	});
});

describe("isSmartDue", () => {
	const now = 1_800_000_000_000;

	it("is due when SMART was never attempted", () => {
		expect(isSmartDue(undefined, now)).toBe(true);
	});

	it("is not due within the interval", () => {
		expect(isSmartDue(now - SMART_INTERVAL_MS + 1, now)).toBe(false);
		expect(isSmartDue(now, now)).toBe(false);
	});

	it("is due once the interval has passed", () => {
		expect(isSmartDue(now - SMART_INTERVAL_MS, now)).toBe(true);
	});

	it("is due when the last attempt is in the future (the clock moved back)", () => {
		expect(isSmartDue(now + 60_000, now)).toBe(true);
	});

	it("uses a ten minute interval", () => {
		expect(SMART_INTERVAL_MS).toBe(10 * 60 * 1000);
	});
});

describe("smartTimeoutMs", () => {
	it("is half the check interval", () => {
		expect(smartTimeoutMs(10_000)).toBe(5_000);
		expect(smartTimeoutMs(60_000)).toBe(30_000);
	});

	it("never exceeds the maximum for long intervals", () => {
		expect(smartTimeoutMs(5 * 60_000)).toBe(SMART_MAX_TIMEOUT_MS);
	});

	it("falls back to the maximum when the interval is missing or invalid", () => {
		expect(smartTimeoutMs(undefined)).toBe(SMART_MAX_TIMEOUT_MS);
		expect(smartTimeoutMs(0)).toBe(SMART_MAX_TIMEOUT_MS);
		expect(smartTimeoutMs(-1)).toBe(SMART_MAX_TIMEOUT_MS);
	});
});
