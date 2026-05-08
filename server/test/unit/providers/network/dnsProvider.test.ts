import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import { NETWORK_ERROR } from "../../../../src/service/infrastructure/network/utils.ts";
import type { Monitor } from "../../../../src/types/index.ts";
import { DNSProvider } from "../../../../src/service/infrastructure/network/DNSProvider.ts";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockResolverInstance = {
	setServers: jest.fn(),
	resolve4: jest.fn<() => Promise<string[]>>(),
	resolve6: jest.fn<() => Promise<string[]>>(),
	resolveCname: jest.fn<() => Promise<string[]>>(),
	resolveMx: jest.fn<() => Promise<unknown[]>>(),
	resolveTxt: jest.fn<() => Promise<string[][]>>(),
	resolveNs: jest.fn<() => Promise<string[]>>(),
	resolve: jest.fn<() => Promise<unknown>>(),
};

const createResolver = () => mockResolverInstance as any;

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "dns",
		url: "example.com",
		dnsServer: "8.8.8.8",
		dnsRecordType: "A",
		...overrides,
	}) as Monitor;

beforeEach(() => {
	mockResolverInstance.setServers.mockClear();
	mockResolverInstance.resolve4.mockReset().mockResolvedValue(["1.2.3.4"]);
	mockResolverInstance.resolve6.mockReset().mockResolvedValue(["::1"]);
	mockResolverInstance.resolveCname.mockReset().mockResolvedValue(["alias.example.com"]);
	mockResolverInstance.resolveMx.mockReset().mockResolvedValue([{ exchange: "mx.example.com", priority: 10 }]);
	mockResolverInstance.resolveTxt.mockReset().mockResolvedValue([["v=spf1"]]);
	mockResolverInstance.resolveNs.mockReset().mockResolvedValue(["ns.example.com"]);
	mockResolverInstance.resolve.mockReset().mockResolvedValue(["something"]);
});

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("DNSProvider", {
	create: () => new DNSProvider(createResolver),
	supportedType: "dns",
	unsupportedType: "ping",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DNSProvider", () => {
	it("returns success with results and payload on resolve", async () => {
		mockResolverInstance.resolve4.mockResolvedValue(["1.2.3.4"]);
		const provider = new DNSProvider(createResolver);

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				monitorId: "mon-1",
				teamId: "team-1",
				type: "dns",
				status: true,
				code: 200,
				message: "Success",
				payload: {
					hostname: "example.com",
					dnsServer: "8.8.8.8",
					recordType: "A",
					resolved: true,
					results: ["1.2.3.4"],
				},
			})
		);
		expect(typeof result.responseTime).toBe("number");
	});

	it("calls setServers with the configured dnsServer", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsServer: "1.1.1.1" }));
		expect(mockResolverInstance.setServers).toHaveBeenCalledWith(["1.1.1.1"]);
	});

	it("defaults to A record when dnsRecordType is not provided", async () => {
		const provider = new DNSProvider(createResolver);
		const result = await provider.handle(makeMonitor({ dnsRecordType: undefined }));
		expect(mockResolverInstance.resolve4).toHaveBeenCalledWith("example.com");
		expect(result.payload?.recordType).toBe("A");
	});

	it("dispatches AAAA records to resolve6", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsRecordType: "AAAA" }));
		expect(mockResolverInstance.resolve6).toHaveBeenCalledWith("example.com");
	});

	it("dispatches CNAME records to resolveCname", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsRecordType: "CNAME" }));
		expect(mockResolverInstance.resolveCname).toHaveBeenCalledWith("example.com");
	});

	it("dispatches MX records to resolveMx", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsRecordType: "MX" }));
		expect(mockResolverInstance.resolveMx).toHaveBeenCalledWith("example.com");
	});

	it("dispatches TXT records to resolveTxt", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsRecordType: "TXT" }));
		expect(mockResolverInstance.resolveTxt).toHaveBeenCalledWith("example.com");
	});

	it("dispatches NS records to resolveNs", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsRecordType: "NS" }));
		expect(mockResolverInstance.resolveNs).toHaveBeenCalledWith("example.com");
	});

	it("falls back to generic resolve for unrecognized record types", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsRecordType: "SOA" }));
		expect(mockResolverInstance.resolve).toHaveBeenCalledWith("example.com", "SOA");
	});

	it("treats record type case-insensitively", async () => {
		const provider = new DNSProvider(createResolver);
		await provider.handle(makeMonitor({ dnsRecordType: "mx" }));
		expect(mockResolverInstance.resolveMx).toHaveBeenCalledWith("example.com");
	});

	it("returns failure response with NETWORK_ERROR when resolver rejects", async () => {
		mockResolverInstance.resolve4.mockRejectedValue(new Error("ENOTFOUND"));
		const provider = new DNSProvider(createResolver);

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				monitorId: "mon-1",
				teamId: "team-1",
				type: "dns",
				status: false,
				code: NETWORK_ERROR,
				message: "ENOTFOUND",
				payload: expect.objectContaining({
					hostname: "example.com",
					dnsServer: "8.8.8.8",
					recordType: "A",
					resolved: false,
					results: null,
				}),
			})
		);
		expect(typeof result.responseTime).toBe("number");
	});

	it("stringifies non-Error rejections in failure response", async () => {
		mockResolverInstance.resolve4.mockRejectedValue("DNS bombed");
		const provider = new DNSProvider(createResolver);

		const result = await provider.handle(makeMonitor());

		expect(result.status).toBe(false);
		expect(result.message).toBe("DNS bombed");
	});

	it("throws AppError when dnsServer is missing", async () => {
		const provider = new DNSProvider(createResolver);

		await expect(provider.handle(makeMonitor({ dnsServer: undefined }))).rejects.toThrow("DNS server is required for DNS monitoring");
	});

	it("falls back to default message when underlying error has empty message", async () => {
		mockResolverInstance.setServers.mockImplementationOnce(() => {
			throw new Error("");
		});
		const provider = new DNSProvider(createResolver);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing DNS check");
	});

	it("stringifies non-Error throws from outside timeRequest", async () => {
		mockResolverInstance.setServers.mockImplementationOnce(() => {
			throw 42;
		});
		const provider = new DNSProvider(createResolver);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("42");
	});
});
