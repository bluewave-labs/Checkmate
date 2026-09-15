import { describe, expect, it, jest } from "@jest/globals";
import { PingProvider } from "../../../../src/service/network/PingProvider.ts";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import type { Monitor } from "../../../../src/domain/monitors/monitor.type.ts";
import * as net from "net";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "ping",
		url: "example.com",
		...overrides,
	}) as Monitor;

const createMockPing = (result?: Partial<{ alive: boolean; time: number | string }>) => ({
	promise: {
		probe: jest.fn().mockResolvedValue({
			alive: true,
			time: 25,
			...result,
		}),
	},
});

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("PingProvider", {
	create: () => new PingProvider(createMockPing() as any, net),
	supportedType: "ping",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PingProvider", () => {
	it("returns success when host is alive", async () => {
		const provider = new PingProvider(createMockPing({ alive: true, time: 30 }) as any, net);

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				monitorId: "mon-1",
				teamId: "team-1",
				type: "ping",
				status: true,
				code: 200,
				message: "Success",
				responseTime: 30,
			})
		);
	});

	it("returns failure when host is not alive", async () => {
		const provider = new PingProvider(createMockPing({ alive: false, time: 0 }) as any, net);

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				status: false,
				code: 5000,
				message: "Ping failed",
			})
		);
	});

	it("parses string time values", async () => {
		const provider = new PingProvider(createMockPing({ alive: true, time: "42.5" }) as any, net);

		const result = await provider.handle(makeMonitor());

		expect(result.responseTime).toBe(42.5);
	});

	it("defaults responseTime to 0 for non-numeric time", async () => {
		const provider = new PingProvider(createMockPing({ alive: true, time: "unknown" }) as any, net);

		const result = await provider.handle(makeMonitor());

		expect(result.responseTime).toBe(0);
	});

	it("defaults status to false when alive is undefined", async () => {
		const provider = new PingProvider(createMockPing({ alive: undefined as any }) as any, net);

		const result = await provider.handle(makeMonitor());

		expect(result.status).toBe(false);
	});

	it("sanitizes URL by stripping protocol and path", async () => {
		const mockPing = createMockPing();
		const provider = new PingProvider(mockPing as any, net);

		await provider.handle(makeMonitor({ url: "https://example.com/path?query=1" }));

		expect(mockPing.promise.probe).toHaveBeenCalledWith("example.com");
	});

	it("sanitizes URL by stripping port", async () => {
		const mockPing = createMockPing();
		const provider = new PingProvider(mockPing as any, net);

		await provider.handle(makeMonitor({ url: "example.com:8080" }));

		expect(mockPing.promise.probe).toHaveBeenCalledWith("example.com");
	});

	it("keeps a bare IPv6 address intact", async () => {
		const mockPing = createMockPing();
		const provider = new PingProvider(mockPing as any, net);

		await provider.handle(makeMonitor({ url: "2606:4700:4700::1111" }));

		expect(mockPing.promise.probe).toHaveBeenCalledWith("2606:4700:4700::1111");
	});

	it("unwraps a bracketed IPv6 address and drops its port", async () => {
		const mockPing = createMockPing();
		const provider = new PingProvider(mockPing as any, net);

		await provider.handle(makeMonitor({ url: "[2606:4700:4700::1111]:53" }));

		expect(mockPing.promise.probe).toHaveBeenCalledWith("2606:4700:4700::1111");
	});

	it("throws AppError when url is missing", async () => {
		const provider = new PingProvider(createMockPing() as any, net);

		await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("URL is required for ping monitor");
	});

	it("throws AppError when ping.probe rejects", async () => {
		const mockPing = { promise: { probe: jest.fn().mockRejectedValue(new Error("Host unreachable")) } };
		const provider = new PingProvider(mockPing as any, net);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("Host unreachable");
	});

	it("throws AppError when probe returns no response", async () => {
		const mockPing = { promise: { probe: jest.fn().mockResolvedValue(null) } };
		const provider = new PingProvider(mockPing as any, net);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("No response from ping");
	});

	it("throws AppError with stringified message for non-Error throws", async () => {
		const mockPing = { promise: { probe: jest.fn().mockRejectedValue(42) } };
		const provider = new PingProvider(mockPing as any, net);

		await expect(provider.handle(makeMonitor())).rejects.toThrow("42");
	});
});
