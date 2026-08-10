import { describe, expect, it } from "@jest/globals";
import { extractDomainExpiryDate, fetchMonitorDomain } from "../../../src/api/controllers/controllerUtils.ts";
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

	it("returns null when no expiry key exists", () => {
		expect(extractDomainExpiryDate({ "Domain Name": "example.com" })).toBeNull();
	});

	it("returns null when the expiry value cannot be parsed", () => {
		expect(extractDomainExpiryDate({ "Expiry Date": "not-a-date" })).toBeNull();
	});
});

describe("fetchMonitorDomain", () => {
	it("walks up from the hostname to the registrable domain", async () => {
		const queried: string[] = [];
		const client = {
			domain: async (domain: string) => {
				queried.push(domain);
				return domain === "example.com" ? { "whois.verisign-grs.com": { "Expiry Date": "2027-08-13T04:00:00Z" } } : {};
			},
		};

		const result = await fetchMonitorDomain(client as never, makeMonitor("https://www.example.com"));

		expect(queried).toEqual(["www.example.com", "example.com"]);
		expect(result).toEqual({ domain: "example.com", expiryDate: "2027-08-13T04:00:00.000Z" });
	});

	it("throws when no candidate has an expiry date", async () => {
		const client = {
			domain: async () => ({ "whois.verisign-grs.com": { "Domain Name": "example.com" } }),
		};

		await expect(fetchMonitorDomain(client as never, makeMonitor("https://example.com"))).rejects.toThrow("Domain expiry not found");
	});
});
