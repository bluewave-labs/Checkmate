import { describe, expect, it } from "@jest/globals";
import { fetchMonitorCertificate } from "../../../src/api/controllers/controllerUtils.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { SSLDetails, SSLOptions } from "ssl-checker";

// Regression cover for #3646: the certificate probe parsed the monitor URL but
// dropped its port, so a monitor on a non-standard port had its certificate
// checked on 443 and surfaced as "N/A" in the UI.

const VALID_CERT: SSLDetails = {
	daysRemaining: 30,
	valid: true,
	validFrom: "2026-01-01T00:00:00.000Z",
	validTo: "2026-12-31T00:00:00.000Z",
	validFor: ["example.com"],
};

/** Records the arguments the checker was called with. */
const spyChecker = (cert: SSLDetails = VALID_CERT) => {
	const calls: Array<{ hostname: string; options?: SSLOptions }> = [];
	const checker = (async (hostname: string, options?: SSLOptions) => {
		calls.push({ hostname, options });
		return cert;
	}) as unknown as typeof import("ssl-checker").default;
	return { checker, calls };
};

const monitorWithUrl = (url: string) => ({ url }) as Monitor;

describe("fetchMonitorCertificate", () => {
	it("probes the port named in the monitor URL", async () => {
		const { checker, calls } = spyChecker();

		await fetchMonitorCertificate(checker, monitorWithUrl("https://example.com:54321"));

		expect(calls).toHaveLength(1);
		expect(calls[0].hostname).toBe("example.com");
		expect(calls[0].options?.port).toBe(54321);
	});

	it("falls back to 443 when the URL names no port", async () => {
		const { checker, calls } = spyChecker();

		await fetchMonitorCertificate(checker, monitorWithUrl("https://example.com"));

		expect(calls[0].options?.port).toBe(443);
	});

	it("passes an explicit 443 through unchanged", async () => {
		const { checker, calls } = spyChecker();

		await fetchMonitorCertificate(checker, monitorWithUrl("https://example.com:443"));

		expect(calls[0].options?.port).toBe(443);
	});

	it("never passes NaN as the port", async () => {
		const { checker, calls } = spyChecker();

		await fetchMonitorCertificate(checker, monitorWithUrl("https://example.com"));

		expect(Number.isNaN(calls[0].options?.port)).toBe(false);
	});

	it("returns the certificate details it received", async () => {
		const { checker } = spyChecker();

		const cert = await fetchMonitorCertificate(checker, monitorWithUrl("https://example.com:8443"));

		expect(cert.validTo).toBe(VALID_CERT.validTo);
	});

	it("throws when the certificate has no expiry", async () => {
		const { checker } = spyChecker({ ...VALID_CERT, validTo: undefined as unknown as string });

		await expect(fetchMonitorCertificate(checker, monitorWithUrl("https://example.com:8443"))).rejects.toThrow("Certificate not found");
	});
});
