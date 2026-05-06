import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { DnsProvider } from "../../../../src/service/infrastructure/network/DnsProvider.ts";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import { NETWORK_ERROR } from "../../../../src/service/infrastructure/network/utils.ts";
import type { Monitor } from "../../../../src/types/index.ts";

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "dns",
		url: "example.com",
		dnsRecordType: "A",
		...overrides,
	}) as Monitor;

interface MockResolver {
	setServers: jest.Mock;
	resolve4: jest.Mock;
	resolve6: jest.Mock;
	resolveCname: jest.Mock;
	resolveMx: jest.Mock;
	resolveTxt: jest.Mock;
	resolveNs: jest.Mock;
	resolve: jest.Mock;
}

const createMockResolver = (): MockResolver => ({
	setServers: jest.fn(),
	resolve4: jest.fn(),
	resolve6: jest.fn(),
	resolveCname: jest.fn(),
	resolveMx: jest.fn(),
	resolveTxt: jest.fn(),
	resolveNs: jest.fn(),
	resolve: jest.fn(),
});

const createResolverCtor = (mock: MockResolver) => jest.fn().mockImplementation(() => mock) as unknown as new () => MockResolver;

testStatusProviderContract("DnsProvider", {
	create: () => {
		const mock = createMockResolver();
		mock.resolve4.mockResolvedValue(["1.2.3.4"]);
		return new DnsProvider(createResolverCtor(mock) as any);
	},
	supportedType: "dns",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

describe("DnsProvider", () => {
	let mock: MockResolver;
	let provider: DnsProvider;

	beforeEach(() => {
		mock = createMockResolver();
		provider = new DnsProvider(createResolverCtor(mock) as any);
	});

	it("resolves A records", async () => {
		mock.resolve4.mockResolvedValue(["1.2.3.4"]);

		const result = await provider.handle(makeMonitor());

		expect(result.status).toBe(true);
		expect(result.code).toBe(200);
		expect(result.payload.resolved).toBe(true);
		expect(result.payload.results).toEqual(["1.2.3.4"]);
		expect(result.payload.recordType).toBe("A");
		expect(mock.resolve4).toHaveBeenCalledWith("example.com");
	});

	it("uses the configured DNS server", async () => {
		mock.resolve4.mockResolvedValue(["1.2.3.4"]);

		await provider.handle(makeMonitor({ dnsServer: "8.8.8.8" }));

		expect(mock.setServers).toHaveBeenCalledWith(["8.8.8.8"]);
	});

	it("returns down status on resolution failure", async () => {
		mock.resolve4.mockRejectedValue(new Error("ENOTFOUND example.com"));

		const result = await provider.handle(makeMonitor({ url: "nonexistent.invalid" }));

		expect(result.status).toBe(false);
		expect(result.code).toBe(NETWORK_ERROR);
		expect(result.message).toContain("ENOTFOUND");
		expect(result.payload.resolved).toBe(false);
		expect(result.payload.results).toBeNull();
	});

	it("resolves MX records", async () => {
		const mxRecords = [{ exchange: "mail.example.com", priority: 10 }];
		mock.resolveMx.mockResolvedValue(mxRecords);

		const result = await provider.handle(makeMonitor({ dnsRecordType: "MX" }));

		expect(result.status).toBe(true);
		expect(result.payload.results).toEqual(mxRecords);
		expect(mock.resolveMx).toHaveBeenCalledWith("example.com");
	});

	it("normalizes the record type to uppercase", async () => {
		mock.resolve6.mockResolvedValue(["::1"]);

		const result = await provider.handle(makeMonitor({ dnsRecordType: "aaaa" }));

		expect(result.payload.recordType).toBe("AAAA");
		expect(mock.resolve6).toHaveBeenCalledWith("example.com");
	});

	it("falls through to generic resolve() for unknown record types", async () => {
		mock.resolve.mockResolvedValue(["payload"]);

		const result = await provider.handle(makeMonitor({ dnsRecordType: "SRV" }));

		expect(result.status).toBe(true);
		expect(mock.resolve).toHaveBeenCalledWith("example.com", "SRV");
	});

	it("throws AppError when hostname is missing", async () => {
		await expect(provider.handle(makeMonitor({ url: undefined }))).rejects.toThrow("Hostname is required");
	});

	it("times out long-running DNS queries", async () => {
		mock.resolve4.mockImplementation(() => new Promise(() => {}));

		const result = await provider.handle(makeMonitor());

		expect(result.status).toBe(false);
		expect(result.message).toMatch(/timed out/i);
		expect(result.payload.resolved).toBe(false);
	}, 15000);
});
