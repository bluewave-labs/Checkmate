import { describe, expect, it, jest } from "@jest/globals";
import { fetchMonitorCertificate } from "../../../src/controllers/controllerUtils.ts";
import type { Monitor } from "../../../src/types/index.ts";
import type { SSLDetails } from "ssl-checker";

const certificate: SSLDetails = {
	daysRemaining: 30,
	valid: true,
	validFrom: "2026-01-01T00:00:00.000Z",
	validTo: "2026-06-01T00:00:00.000Z",
	validFor: ["checkmate.example.org"],
};

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "monitor-1",
		teamId: "team-1",
		url: "https://checkmate.example.org",
		ignoreTlsErrors: false,
		...overrides,
	}) as Monitor;

describe("controllerUtils", () => {
	describe("fetchMonitorCertificate", () => {
		it("checks the explicit HTTPS URL port when present", async () => {
			const checker = jest.fn().mockResolvedValue(certificate);

			await fetchMonitorCertificate(checker as any, makeMonitor({ url: "https://checkmate.example.org:54321/status" }));

			expect(checker).toHaveBeenCalledWith("checkmate.example.org", { port: 54321 });
		});

		it("uses the monitor port when the URL does not include one", async () => {
			const checker = jest.fn().mockResolvedValue(certificate);

			await fetchMonitorCertificate(checker as any, makeMonitor({ url: "https://checkmate.example.org/status", port: 8443 }));

			expect(checker).toHaveBeenCalledWith("checkmate.example.org", { port: 8443 });
		});

		it("keeps the previous default-port behavior when no port is configured", async () => {
			const checker = jest.fn().mockResolvedValue(certificate);

			await fetchMonitorCertificate(checker as any, makeMonitor());

			expect(checker).toHaveBeenCalledWith("checkmate.example.org", undefined);
		});

		it("throws when no certificate expiry is returned", async () => {
			const checker = jest.fn().mockResolvedValue({ ...certificate, validTo: undefined });

			await expect(fetchMonitorCertificate(checker as any, makeMonitor())).rejects.toThrow("Certificate not found");
		});
	});
});
