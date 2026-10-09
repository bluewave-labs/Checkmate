import { describe, expect, it } from "@jest/globals";
import { createDomainExpiryCache, extractDomainExpiryDate, fetchMonitorDomain } from "../../../src/api/controllers/controllerUtils.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";

const makeMonitor = (url: string): Monitor =>
	({
		url,
		type: "http",
	}) as unknown as Monitor;

describe("extractDomainExpiryDate", () => {
	it("returns an ISO date for ISO registry expiry values", () => {
		expect(extractDomainExpiryDate({ "Registry Expiry Date": "2027-08-13T04:00:00Z" })).toBe("2027-08-13T04:00:00.000Z");
	});

	it("returns an ISO date for dd-MMM-yyyy expiry values", () => {
		expect(extractDomainExpiryDate({ "Expiry Date": "14-Feb-2027" })).toBe("2027-02-14T00:00:00.000Z");
	});

	it("returns an ISO date for yyyy-MMM-dd expiry values (TRABIS, .tr)", () => {
		expect(extractDomainExpiryDate({ "Expiry Date": "2029-Sep-01" })).toBe("2029-09-01T00:00:00.000Z");
		expect(extractDomainExpiryDate({ "Expiry Date": "2027-Feb-04." })).toBe("2027-02-04T00:00:00.000Z");
	});

	it("returns null when no expiry key exists", () => {
		expect(extractDomainExpiryDate({ "Domain Name": "example.com" })).toBeNull();
	});

	it("returns null when the expiry value cannot be parsed", () => {
		expect(extractDomainExpiryDate({ "Expiry Date": "not-a-date" })).toBeNull();
	});
});

describe("fetchMonitorDomain", () => {
	it("queries the registrable domain for subdomains", async () => {
		const queried: string[] = [];
		const client = {
			domain: async (domain: string) => {
				queried.push(domain);
				return { "whois.verisign-grs.com": { "Expiry Date": "2027-08-13T04:00:00Z" } };
			},
		};
		const cache = createDomainExpiryCache(60_000, 10_000);

		const result = await fetchMonitorDomain(client as never, makeMonitor("https://www.example.co.uk"), cache);

		expect(queried).toEqual(["example.co.uk"]);
		expect(result).toEqual({ domain: "example.co.uk", expiryDate: "2027-08-13T04:00:00.000Z" });
	});

	it("uses the current WHOIS server for .tr domains", async () => {
		const calls: Array<{ domain: string; options: Record<string, unknown> }> = [];
		const client = {
			domain: async (domain: string, options: Record<string, unknown>) => {
				calls.push({ domain, options });
				return { "whois.trabis.gov.tr": { "Expiry Date": "2029-Sep-01" } };
			},
		};
		const cache = createDomainExpiryCache(60_000, 10_000);

		const result = await fetchMonitorDomain(client as never, makeMonitor("https://www.example.org.tr"), cache);

		expect(calls[0]?.domain).toBe("example.org.tr");
		expect(calls[0]?.options.host).toBe("whois.trabis.gov.tr");
		expect(result).toEqual({ domain: "example.org.tr", expiryDate: "2029-09-01T00:00:00.000Z" });
	});

	it("leaves WHOIS server selection to whoiser for other TLDs", async () => {
		const calls: Array<Record<string, unknown>> = [];
		const client = {
			domain: async (_domain: string, options: Record<string, unknown>) => {
				calls.push(options);
				return { "whois.verisign-grs.com": { "Expiry Date": "2027-08-13T04:00:00Z" } };
			},
		};

		await fetchMonitorDomain(client as never, makeMonitor("https://example.com"), createDomainExpiryCache(60_000, 10_000));

		expect(calls[0]).not.toHaveProperty("host");
	});

	it("returns null expiry for bare IP addresses without querying whois", async () => {
		const client = {
			domain: async () => {
				throw new Error("should not be called");
			},
		};

		const result = await fetchMonitorDomain(client as never, makeMonitor("https://1.2.3.4"));

		expect(result).toEqual({ domain: null, expiryDate: null });
	});

	it("returns null expiry when the registry has no expiry record", async () => {
		const client = {
			domain: async () => ({ "whois.verisign-grs.com": { "Domain Name": "example.com" } }),
		};

		const result = await fetchMonitorDomain(client as never, makeMonitor("https://example.com"));

		expect(result).toEqual({ domain: "example.com", expiryDate: null });
	});

	it("serves repeat lookups from cache", async () => {
		let calls = 0;
		const client = {
			domain: async () => {
				calls++;
				return { "whois.verisign-grs.com": { "Expiry Date": "2027-08-13T04:00:00Z" } };
			},
		};
		const cache = createDomainExpiryCache(60_000, 10_000);
		const monitor = makeMonitor("https://example.com");

		await fetchMonitorDomain(client as never, monitor, cache);
		const second = await fetchMonitorDomain(client as never, monitor, cache);

		expect(calls).toBe(1);
		expect(second).toEqual({ domain: "example.com", expiryDate: "2027-08-13T04:00:00.000Z" });
	});

	it("re-queries after the cache expires", async () => {
		let calls = 0;
		const client = {
			domain: async () => {
				calls++;
				return { "whois.verisign-grs.com": { "Expiry Date": "2027-08-13T04:00:00Z" } };
			},
		};
		const cache = createDomainExpiryCache(-1, -1);
		const monitor = makeMonitor("https://example.com");

		await fetchMonitorDomain(client as never, monitor, cache);
		await fetchMonitorDomain(client as never, monitor, cache);

		expect(calls).toBe(2);
	});
});
