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

		it("accepts service labels with leading underscore (DMARC, SRV, ACME)", () => {
			for (const url of ["_dmarc.example.com", "_imaps._tcp.example.com", "_acme-challenge.example.com"]) {
				const parsed = createMonitorBodyValidation.parse({
					...baseDnsBody,
					url,
					dnsServer: "8.8.8.8",
					dnsRecordType: "TXT",
				});
				expect(parsed.url).toBe(url);
			}
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

describe("monitorValidation — strategy gating", () => {
	describe("createMonitorBodyValidation", () => {
		it("accepts strategy on pagespeed monitors", () => {
			const parsed = createMonitorBodyValidation.parse({
				name: "PS check",
				type: "pagespeed",
				url: "https://example.com",
				strategy: "mobile",
			});
			expect(parsed.strategy).toBe("mobile");
		});

		it("accepts pagespeed monitors without a strategy", () => {
			const parsed = createMonitorBodyValidation.parse({
				name: "PS check",
				type: "pagespeed",
				url: "https://example.com",
			});
			expect(parsed.strategy).toBeUndefined();
		});

		it("rejects strategy on non-pagespeed monitor types", () => {
			for (const type of ["http", "ping", "docker", "port", "game", "grpc", "websocket", "dns", "hardware"] as const) {
				expect(() =>
					createMonitorBodyValidation.parse({
						name: "wrong-type check",
						type,
						url: type === "dns" ? "example.com" : "https://example.com",
						strategy: "desktop",
					})
				).toThrow();
			}
		});

		it("allows non-pagespeed monitors without a strategy", () => {
			const parsed = createMonitorBodyValidation.parse({
				name: "HTTP check",
				type: "http",
				url: "https://example.com",
			});
			expect(parsed.strategy).toBeUndefined();
		});
	});

	describe("editMonitorBodyValidation", () => {
		it("rejects strategy when type is explicitly non-pagespeed", () => {
			expect(() =>
				editMonitorBodyValidation.parse({
					type: "http",
					strategy: "mobile",
				})
			).toThrow();
		});

		it("allows strategy when type is omitted (partial edit)", () => {
			const parsed = editMonitorBodyValidation.parse({
				strategy: "mobile",
			});
			expect(parsed.strategy).toBe("mobile");
		});
	});

	describe("importMonitorsBodyValidation", () => {
		it("does not inject a default strategy on imported HTTP monitors", () => {
			const parsed = importMonitorsBodyValidation.parse({
				monitors: [
					{
						name: "Imported HTTP",
						type: "http",
						url: "https://example.com",
					},
				],
			});
			expect(parsed.monitors[0].strategy).toBeUndefined();
		});

		it("rejects strategy on imported non-pagespeed monitors", () => {
			expect(() =>
				importMonitorsBodyValidation.parse({
					monitors: [
						{
							name: "Imported HTTP",
							type: "http",
							url: "https://example.com",
							strategy: "desktop",
						},
					],
				})
			).toThrow();
		});
	});
});
