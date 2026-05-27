import { describe, expect, it, jest } from "@jest/globals";
import { fetchMonitorCertificate } from "../../../src/controllers/controllerUtils.ts";
import type { Monitor } from "../../../src/types/monitor.ts";

const certificate = {
	daysRemaining: 30,
	valid: true,
	validFrom: "2026-01-01T00:00:00.000Z",
	validTo: "2026-02-01T00:00:00.000Z",
	validFor: ["checkmate.example.org"],
};

const makeMonitor = (url: string) =>
	({
		url,
	}) as Monitor;

describe("fetchMonitorCertificate", () => {
	it("passes a custom HTTPS port to the SSL checker", async () => {
		const checker = jest.fn().mockResolvedValue(certificate);

		await fetchMonitorCertificate(checker, makeMonitor("https://checkmate.example.org:54321/status"));

		expect(checker).toHaveBeenCalledWith("checkmate.example.org", { port: 54321 });
	});

	it("uses the SSL checker's default port when the URL does not include one", async () => {
		const checker = jest.fn().mockResolvedValue(certificate);

		await fetchMonitorCertificate(checker, makeMonitor("https://checkmate.example.org/status"));

		expect(checker).toHaveBeenCalledWith("checkmate.example.org", undefined);
	});
});
