import { describe, expect, it } from "@jest/globals";
import {
	createMonitorBodyValidation,
	editMonitorBodyValidation,
	importMonitorsBodyValidation,
} from "../../../src/api/validation/monitorValidation.ts";

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

describe("monitorValidation — HEAD method gating", () => {
	const baseHead = {
		name: "HEAD check",
		type: "http" as const,
		url: "https://example.com",
		method: "HEAD" as const,
	};

	describe("createMonitorBodyValidation", () => {
		it("accepts a HEAD monitor with no body matching", () => {
			const parsed = createMonitorBodyValidation.parse(baseHead);
			expect(parsed.method).toBe("HEAD");
		});

		it("accepts GET together with advanced matching", () => {
			const parsed = createMonitorBodyValidation.parse({
				...baseHead,
				method: "GET",
				useAdvancedMatching: true,
				jsonPath: "status",
			});
			expect(parsed.method).toBe("GET");
		});

		it("rejects HEAD combined with advanced matching", () => {
			expect(() => createMonitorBodyValidation.parse({ ...baseHead, useAdvancedMatching: true })).toThrow();
		});

		it("rejects HEAD combined with a non-empty jsonPath", () => {
			expect(() => createMonitorBodyValidation.parse({ ...baseHead, jsonPath: "status" })).toThrow();
		});

		it("allows HEAD with an empty-string jsonPath", () => {
			const parsed = createMonitorBodyValidation.parse({ ...baseHead, jsonPath: "" });
			expect(parsed.method).toBe("HEAD");
		});
	});

	describe("editMonitorBodyValidation", () => {
		it("rejects HEAD combined with advanced matching", () => {
			expect(() => editMonitorBodyValidation.parse({ method: "HEAD", useAdvancedMatching: true })).toThrow();
		});
	});

	describe("importMonitorsBodyValidation", () => {
		it("rejects HEAD combined with a jsonPath on imported monitors", () => {
			expect(() => importMonitorsBodyValidation.parse({ monitors: [{ ...baseHead, jsonPath: "status" }] })).toThrow();
		});
	});
});

describe("monitorValidation — customUpCodes", () => {
	const baseHttpBody = {
		name: "HTTP check",
		type: "http" as const,
		url: "https://example.com",
	};

	describe("createMonitorBodyValidation", () => {
		it("accepts valid HTTP status codes", () => {
			const parsed = createMonitorBodyValidation.parse({
				...baseHttpBody,
				customUpCodes: [200, 301, 404, 503],
			});
			expect(parsed.customUpCodes).toEqual([200, 301, 404, 503]);
		});

		it("accepts non-standard HTTP status codes (Cloudflare, AWS ELB, etc.)", () => {
			const parsed = createMonitorBodyValidation.parse({
				...baseHttpBody,
				customUpCodes: [419, 420, 440, 449, 460, 463, 497, 499, 509, 520, 521, 522, 523, 524, 525, 526, 527, 529, 530, 561],
			});
			expect(parsed.customUpCodes).toEqual([419, 420, 440, 449, 460, 463, 497, 499, 509, 520, 521, 522, 523, 524, 525, 526, 527, 529, 530, 561]);
		});

		it("rejects invalid HTTP status codes", () => {
			expect(() =>
				createMonitorBodyValidation.parse({
					...baseHttpBody,
					customUpCodes: [5000],
				})
			).toThrow();

			expect(() =>
				createMonitorBodyValidation.parse({
					...baseHttpBody,
					customUpCodes: [-1],
				})
			).toThrow();
		});

		it("rejects fractional or floating-point status codes", () => {
			expect(() =>
				createMonitorBodyValidation.parse({
					...baseHttpBody,
					customUpCodes: [200.5],
				})
			).toThrow();
		});

		it("rejects status codes below 100", () => {
			expect(() =>
				createMonitorBodyValidation.parse({
					...baseHttpBody,
					customUpCodes: [99],
				})
			).toThrow();
		});

		it("rejects valid-looking but mathematically unsupported status codes (e.g. 599)", () => {
			expect(() =>
				createMonitorBodyValidation.parse({
					...baseHttpBody,
					customUpCodes: [599], // Not in Node's default list nor our expanded list
				})
			).toThrow();
		});

		it("defaults to an empty array when not provided", () => {
			const parsed = createMonitorBodyValidation.parse(baseHttpBody);
			expect(parsed.customUpCodes).toEqual([]);
		});
	});

	describe("editMonitorBodyValidation", () => {
		it("accepts valid HTTP status codes on edits", () => {
			const parsed = editMonitorBodyValidation.parse({
				customUpCodes: [200, 201],
			});
			expect(parsed.customUpCodes).toEqual([200, 201]);
		});

		it("accepts non-standard HTTP status codes on edits", () => {
			const parsed = editMonitorBodyValidation.parse({
				customUpCodes: [419, 420, 440, 449, 460, 463, 497, 499, 509, 520, 521, 522, 523, 524, 525, 526, 527, 529, 530, 561],
			});
			expect(parsed.customUpCodes).toEqual([419, 420, 440, 449, 460, 463, 497, 499, 509, 520, 521, 522, 523, 524, 525, 526, 527, 529, 530, 561]);
		});

		it("rejects invalid HTTP status codes on edits", () => {
			expect(() =>
				editMonitorBodyValidation.parse({
					customUpCodes: [9999],
				})
			).toThrow();
		});
	});

	describe("importMonitorsBodyValidation", () => {
		it("retains valid HTTP status codes on imported HTTP monitors", () => {
			const parsed = importMonitorsBodyValidation.parse({
				monitors: [
					{
						...baseHttpBody,
						customUpCodes: [404],
					},
				],
			});
			expect(parsed.monitors[0].customUpCodes).toEqual([404]);
		});

		it("accepts non-standard HTTP status codes on imported HTTP monitors", () => {
			const parsed = importMonitorsBodyValidation.parse({
				monitors: [
					{
						...baseHttpBody,
						customUpCodes: [419, 420, 440, 449, 460, 463, 497, 499, 509, 520, 521, 522, 523, 524, 525, 526, 527, 529, 530, 561],
					},
				],
			});
			expect(parsed.monitors[0].customUpCodes).toEqual([
				419, 420, 440, 449, 460, 463, 497, 499, 509, 520, 521, 522, 523, 524, 525, 526, 527, 529, 530, 561,
			]);
		});

		it("rejects invalid HTTP status codes on imported HTTP monitors", () => {
			expect(() =>
				importMonitorsBodyValidation.parse({
					monitors: [
						{
							...baseHttpBody,
							customUpCodes: [5000],
						},
					],
				})
			).toThrow();
		});

		it("defaults to an empty array when not provided on import", () => {
			const parsed = importMonitorsBodyValidation.parse({
				monitors: [baseHttpBody],
			});
			expect(parsed.monitors[0].customUpCodes).toEqual([]);
		});
	});
});
