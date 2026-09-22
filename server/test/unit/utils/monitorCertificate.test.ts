import { describe, expect, it } from "@jest/globals";
import type { SSLDetails, SSLOptions } from "ssl-checker";
import { fetchMonitorCertificate } from "../../../src/api/controllers/controllerUtils.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";

const makeMonitor = (url: string, port?: number): Monitor =>
	({
		url,
		port,
		type: "http",
	}) as unknown as Monitor;

const cert: SSLDetails = {
	daysRemaining: 30,
	valid: true,
	validFrom: "2026-01-01T00:00:00Z",
	validTo: "2026-12-31T00:00:00Z",
	validFor: ["example.com"],
};

const setup = () => {
	const calls: { hostname: string; options?: SSLOptions }[] = [];
	const checker = async (hostname: string, options?: SSLOptions) => {
		calls.push({ hostname, options });
		return cert;
	};
	return { calls, checker };
};

describe("fetchMonitorCertificate", () => {
	it("uses the default port when none is specified", async () => {
		const { calls, checker } = setup();

		await fetchMonitorCertificate(checker, makeMonitor("https://example.com/health"));

		expect(calls).toEqual([{ hostname: "example.com", options: undefined }]);
	});

	it("uses the port from the URL", async () => {
		const { calls, checker } = setup();

		await fetchMonitorCertificate(checker, makeMonitor("https://example.com:54321/health"));

		expect(calls).toEqual([{ hostname: "example.com", options: { port: 54321 } }]);
	});

	it("falls back to monitor.port when the URL has no port", async () => {
		const { calls, checker } = setup();

		await fetchMonitorCertificate(checker, makeMonitor("https://example.com/health", 8443));

		expect(calls).toEqual([{ hostname: "example.com", options: { port: 8443 } }]);
	});

	it("prefers the URL port over monitor.port", async () => {
		const { calls, checker } = setup();

		await fetchMonitorCertificate(checker, makeMonitor("https://www.myurl.com:52345/health", 443));

		expect(calls).toEqual([{ hostname: "www.myurl.com", options: { port: 52345 } }]);
	});

	it("throws when the certificate has no expiry", async () => {
		const checker = async () => ({ ...cert, validTo: undefined }) as unknown as SSLDetails;

		await expect(fetchMonitorCertificate(checker, makeMonitor("https://example.com"))).rejects.toThrow("Certificate not found");
	});
});
