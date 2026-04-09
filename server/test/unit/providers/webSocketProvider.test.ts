import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { WebSocketProvider } from "../../../src/service/infrastructure/network/WebSocketProvider.ts";
import { testStatusProviderContract } from "../../helpers/statusProviderContract.ts";
import { NETWORK_ERROR } from "../../../src/service/infrastructure/network/utils.ts";
import type { Monitor } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "websocket",
		url: "wss://example.com/ws",
		ignoreTlsErrors: false,
		...overrides,
	}) as Monitor;

const createMockWS = (behavior: "open" | "error" = "open") => {
	return jest.fn().mockImplementation((_url: string, _opts: any) => {
		const handlers: Record<string, Function> = {};
		const ws = {
			on: jest.fn((event: string, cb: Function) => {
				handlers[event] = cb;
				if (behavior === "open" && event === "open") {
					process.nextTick(() => cb());
				}
				if (behavior === "error" && event === "error") {
					process.nextTick(() => cb(new Error("Connection failed")));
				}
			}),
			close: jest.fn(),
		};
		return ws;
	}) as any;
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("WebSocketProvider", {
	create: () => new WebSocketProvider(createMockWS("open")),
	supportedType: "websocket",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("WebSocketProvider", () => {
	it("returns success when connection opens", async () => {
		const provider = new WebSocketProvider(createMockWS("open"));

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				monitorId: "mon-1",
				teamId: "team-1",
				type: "websocket",
				status: true,
				code: 200,
				message: "WebSocket check successful",
				payload: { connected: true },
			})
		);
	});

	it("returns failure when connection errors", async () => {
		const provider = new WebSocketProvider(createMockWS("error"));

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				status: false,
				code: NETWORK_ERROR,
				message: "Connection failed",
				payload: { connected: false },
			})
		);
	});

	it("returns failure with generic message for non-Error connection error", async () => {
		const WS = jest.fn().mockImplementation(() => ({
			on: jest.fn((event: string, cb: Function) => {
				if (event === "error") {
					process.nextTick(() => cb("string error"));
				}
			}),
			close: jest.fn(),
		})) as any;

		const provider = new WebSocketProvider(WS);
		const result = await provider.handle(makeMonitor());

		expect(result.message).toBe("WebSocket check failed");
	});

	it("passes rejectUnauthorized: false when ignoreTlsErrors is true", async () => {
		const WS = jest.fn().mockImplementation((_url: string, opts: any) => {
			expect(opts.rejectUnauthorized).toBe(false);
			return {
				on: jest.fn((event: string, cb: Function) => {
					if (event === "open") process.nextTick(() => cb());
				}),
				close: jest.fn(),
			};
		}) as any;

		const provider = new WebSocketProvider(WS);
		await provider.handle(makeMonitor({ ignoreTlsErrors: true }));

		expect(WS).toHaveBeenCalled();
	});

	it("throws AppError when url is missing", async () => {
		const provider = new WebSocketProvider(createMockWS("open"));

		await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("URL is required for WebSocket monitoring");
	});

	it("throws AppError when an unexpected error occurs in outer try", async () => {
		const provider = new WebSocketProvider(createMockWS("open"));
		const monitor = makeMonitor();
		let calls = 0;
		Object.defineProperty(monitor, "url", {
			get() {
				calls++;
				if (calls === 1) throw new Error("getter failed");
				return "wss://example.com";
			},
		});

		await expect(provider.handle(monitor)).rejects.toThrow("getter failed");
	});

	it("throws AppError with fallback message when Error has empty message", async () => {
		const provider = new WebSocketProvider(createMockWS("open"));
		const monitor = makeMonitor();
		let calls = 0;
		Object.defineProperty(monitor, "url", {
			get() {
				calls++;
				if (calls === 1) throw new Error("");
				return "wss://example.com";
			},
		});

		await expect(provider.handle(monitor)).rejects.toThrow("Error performing WebSocket check");
	});

	it("throws AppError with stringified message for non-Error thrown values", async () => {
		const provider = new WebSocketProvider(createMockWS("open"));
		const monitor = makeMonitor();
		let calls = 0;
		Object.defineProperty(monitor, "url", {
			get() {
				calls++;
				if (calls === 1) throw 99;
				return "wss://example.com";
			},
		});

		await expect(provider.handle(monitor)).rejects.toThrow("99");
	});

	describe("connection timeout", () => {
		beforeEach(() => jest.useFakeTimers());
		afterEach(() => jest.useRealTimers());

		it("returns failure on connection timeout", async () => {
			// WS that never fires open or error
			const WS = jest.fn().mockImplementation(() => ({
				on: jest.fn(),
				close: jest.fn(),
			})) as any;

			const provider = new WebSocketProvider(WS);
			const promise = provider.handle(makeMonitor());

			await jest.advanceTimersByTimeAsync(10000);

			const result = await promise;

			expect(result).toEqual(
				expect.objectContaining({
					status: false,
					code: NETWORK_ERROR,
					message: "WebSocket connection timeout",
				})
			);
		});
	});
});
