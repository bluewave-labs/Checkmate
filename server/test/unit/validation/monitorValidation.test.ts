import { describe, expect, it } from "@jest/globals";
import { createMonitorBodyValidation, editMonitorBodyValidation, importMonitorsBodyValidation } from "../../../src/validation/monitorValidation.ts";

const baseDnsBody = {
	name: "DNS check",
	type: "dns" as const,
	url: "example.com",
};

describe("monitorValidation — DNS fields", () => {
	describe("createMonitorBodyValidation", () => {
		it("retains dnsServer and dnsRecordType on a DNS monitor", () => {
			const parsed = createMonitorBodyValidation.parse({
				...baseDnsBody,
				dnsServer: "8.8.8.8",
				dnsRecordType: "A",
			});

			expect(parsed.dnsServer).toBe("8.8.8.8");
			expect(parsed.dnsRecordType).toBe("A");
		});

		it("accepts every supported DNS record type", () => {
			for (const recordType of ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const) {
				const parsed = createMonitorBodyValidation.parse({
					...baseDnsBody,
					dnsServer: "1.1.1.1",
					dnsRecordType: recordType,
				});
				expect(parsed.dnsRecordType).toBe(recordType);
			}
		});

		it("rejects unknown DNS record types", () => {
			expect(() =>
				createMonitorBodyValidation.parse({
					...baseDnsBody,
					dnsServer: "8.8.8.8",
					dnsRecordType: "BOGUS",
				})
			).toThrow();
		});

		it("treats DNS fields as optional (other monitor types still validate)", () => {
			const parsed = createMonitorBodyValidation.parse({
				name: "HTTP check",
				type: "http",
				url: "https://example.com",
			});

			expect(parsed.dnsServer).toBeUndefined();
			expect(parsed.dnsRecordType).toBeUndefined();
		});

		it("rejects a DNS monitor whose url has a scheme or path", () => {
			for (const badUrl of ["https://example.com", "example.com/path", "example.com:53", " example.com"]) {
				expect(() =>
					createMonitorBodyValidation.parse({
						...baseDnsBody,
						url: badUrl,
						dnsServer: "8.8.8.8",
						dnsRecordType: "A",
					})
				).toThrow();
			}
		});

		it("rejects a DNS monitor with an invalid dnsServer", () => {
			expect(() =>
				createMonitorBodyValidation.parse({
					...baseDnsBody,
					dnsServer: "not-an-ip",
					dnsRecordType: "A",
				})
			).toThrow();
		});

		it("does not enforce the hostname rule for non-DNS monitors", () => {
			const parsed = createMonitorBodyValidation.parse({
				name: "HTTP check",
				type: "http",
				url: "https://example.com/some/path",
			});

			expect(parsed.url).toBe("https://example.com/some/path");
		});
	});

	describe("editMonitorBodyValidation", () => {
		it("retains dnsServer and dnsRecordType on edits", () => {
			const parsed = editMonitorBodyValidation.parse({
				dnsServer: "1.1.1.1",
				dnsRecordType: "MX",
			});

			expect(parsed.dnsServer).toBe("1.1.1.1");
			expect(parsed.dnsRecordType).toBe("MX");
		});
	});

	describe("importMonitorsBodyValidation", () => {
		it("retains dnsServer and dnsRecordType on imported DNS monitors", () => {
			const parsed = importMonitorsBodyValidation.parse({
				monitors: [
					{
						name: "Imported DNS",
						type: "dns",
						url: "example.com",
						dnsServer: "8.8.4.4",
						dnsRecordType: "TXT",
					},
				],
			});

			expect(parsed.monitors[0].dnsServer).toBe("8.8.4.4");
			expect(parsed.monitors[0].dnsRecordType).toBe("TXT");
		});
	});
});
