import { jest } from "@jest/globals";
import { DnsProvider } from "../src/service/infrastructure/network/DnsProvider.ts";
import { Monitor } from "../src/types/monitor.js";

// Mock dns/promises
const mockResolve4 = jest.fn();
const mockResolve6 = jest.fn();
const mockResolveCname = jest.fn();
const mockResolveMx = jest.fn();
const mockResolveTxt = jest.fn();
const mockResolveNs = jest.fn();
const mockResolve = jest.fn();
const mockSetServers = jest.fn();

jest.unstable_mockModule("dns/promises", () => ({
	Resolver: jest.fn().mockImplementation(() => ({
		resolve4: mockResolve4,
		resolve6: mockResolve6,
		resolveCname: mockResolveCname,
		resolveMx: mockResolveMx,
		resolveTxt: mockResolveTxt,
		resolveNs: mockResolveNs,
		resolve: mockResolve,
		setServers: mockSetServers,
	})),
}));

const { DnsProvider } = await import("../src/service/infrastructure/network/DnsProvider.ts");

describe("DnsProvider", () => {
	let dnsProvider: DnsProvider;

	beforeEach(() => {
		dnsProvider = new DnsProvider();
		jest.clearAllMocks();
	});

	it("supports 'dns' monitor type", () => {
		expect(dnsProvider.supports("dns")).toBe(true);
		expect(dnsProvider.supports("http")).toBe(false);
	});

	it("resolves A records correctly", async () => {
		const monitor = {
			id: "1",
			teamId: "team-1",
			type: "dns",
			url: "google.com",
			dnsRecordType: "A",
		} as Monitor;

		mockResolve4.mockResolvedValue(["1.2.3.4"]);

		const response = await dnsProvider.handle(monitor);

		expect(response.status).toBe(true);
		expect(response.payload.resolved).toBe(true);
		expect(response.payload.results).toEqual(["1.2.3.4"]);
		expect(mockResolve4).toHaveBeenCalledWith("google.com");
	});

	it("uses custom DNS server if provided", async () => {
		const monitor = {
			id: "1",
			teamId: "team-1",
			type: "dns",
			url: "google.com",
			dnsServer: "8.8.8.8",
			dnsRecordType: "A",
		} as Monitor;

		mockResolve4.mockResolvedValue(["1.2.3.4"]);

		await dnsProvider.handle(monitor);

		expect(mockSetServers).toHaveBeenCalledWith(["8.8.8.8"]);
	});

	it("handles resolution failure", async () => {
		const monitor = {
			id: "1",
			teamId: "team-1",
			type: "dns",
			url: "nonexistent.domain",
			dnsRecordType: "A",
		} as Monitor;

		mockResolve4.mockRejectedValue(new Error("ENOTFOUND"));

		const response = await dnsProvider.handle(monitor);

		expect(response.status).toBe(false);
		expect(response.payload.resolved).toBe(false);
		expect(response.message).toContain("ENOTFOUND");
	});

	it("resolves MX records correctly", async () => {
		const monitor = {
			id: "1",
			teamId: "team-1",
			type: "dns",
			url: "google.com",
			dnsRecordType: "MX",
		} as Monitor;

		const mxRecords = [{ exchange: "mail.google.com", priority: 10 }];
		mockResolveMx.mockResolvedValue(mxRecords);

		const response = await dnsProvider.handle(monitor);

		expect(response.status).toBe(true);
		expect(response.payload.results).toEqual(mxRecords);
		expect(mockResolveMx).toHaveBeenCalledWith("google.com");
	});
});
