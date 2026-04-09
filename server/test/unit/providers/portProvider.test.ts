import { describe, expect, it, jest } from "@jest/globals";
import { PortProvider } from "../../../src/service/infrastructure/network/PortProvider.ts";
import { testStatusProviderContract } from "../../helpers/statusProviderContract.ts";
import { NETWORK_ERROR } from "../../../src/service/infrastructure/network/utils.ts";
import type { Monitor } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "port",
		url: "example.com",
		port: 443,
		...overrides,
	}) as Monitor;

const createMockNet = (behavior: "connect" | "timeout" | "error" = "connect") => {
	const socket = {
		setTimeout: jest.fn(),
		on: jest.fn(),
		end: jest.fn(),
		destroy: jest.fn(),
	};

	const createConnection = jest.fn((opts: any, onConnect: () => void) => {
		if (behavior === "connect") {
			// Simulate immediate connection
			process.nextTick(onConnect);
		} else if (behavior === "timeout") {
			process.nextTick(() => {
				const timeoutCb = socket.on.mock.calls.find((c: any) => c[0] === "timeout");
				// Simulate via setTimeout handler
				const setTimeoutCb = socket.setTimeout.mock.calls[0];
				if (setTimeoutCb) {
					// The timeout event handler is registered via socket.on("timeout", ...)
				}
			});
		} else if (behavior === "error") {
			process.nextTick(() => {
				const errorCb = socket.on.mock.calls.find((c: any) => c[0] === "error");
				if (errorCb) {
					errorCb[1](new Error("ECONNREFUSED"));
				}
			});
		}
		return socket;
	});

	return { createConnection, __socket: socket } as any;
};

const createSuccessNet = () => {
	const socket = {
		setTimeout: jest.fn(),
		on: jest.fn(),
		end: jest.fn(),
		destroy: jest.fn(),
	};
	return {
		createConnection: jest.fn((_opts: any, onConnect: () => void) => {
			process.nextTick(onConnect);
			return socket;
		}),
	} as any;
};

const createErrorNet = (error: Error = new Error("ECONNREFUSED")) => {
	const socket = {
		setTimeout: jest.fn(),
		on: jest.fn((event: string, cb: Function) => {
			if (event === "error") {
				process.nextTick(() => cb(error));
			}
		}),
		end: jest.fn(),
		destroy: jest.fn(),
	};
	return {
		createConnection: jest.fn(() => socket),
	} as any;
};

const createTimeoutNet = () => {
	const socket = {
		setTimeout: jest.fn(),
		on: jest.fn((event: string, cb: Function) => {
			if (event === "timeout") {
				process.nextTick(() => cb());
			}
		}),
		end: jest.fn(),
		destroy: jest.fn(),
	};
	return {
		createConnection: jest.fn(() => socket),
	} as any;
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("PortProvider", {
	create: () => new PortProvider(createSuccessNet()),
	supportedType: "port",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PortProvider", () => {
	it("returns success when port connection succeeds", async () => {
		const provider = new PortProvider(createSuccessNet());

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				monitorId: "mon-1",
				teamId: "team-1",
				type: "port",
				status: true,
				code: 200,
				message: "Port check successful",
				payload: { success: true },
			})
		);
		expect(result.responseTime).toBeGreaterThanOrEqual(0);
	});

	it("returns failure when connection errors", async () => {
		const provider = new PortProvider(createErrorNet());

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				status: false,
				code: NETWORK_ERROR,
				message: "ECONNREFUSED",
				payload: { success: false },
			})
		);
	});

	it("returns failure with generic message for non-Error connection error", async () => {
		const net = createErrorNet();
		// Override the on handler to throw a non-Error
		const socket = {
			setTimeout: jest.fn(),
			on: jest.fn((event: string, cb: Function) => {
				if (event === "error") {
					process.nextTick(() => cb("string error"));
				}
			}),
			end: jest.fn(),
			destroy: jest.fn(),
		};
		net.createConnection = jest.fn(() => socket);

		const provider = new PortProvider(net);
		const result = await provider.handle(makeMonitor());

		expect(result.message).toBe("Port check failed");
	});

	it("returns failure when connection times out", async () => {
		const provider = new PortProvider(createTimeoutNet());

		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				status: false,
				code: NETWORK_ERROR,
				message: "Connection timeout",
			})
		);
	});

	it("throws AppError when url is missing", async () => {
		const provider = new PortProvider(createSuccessNet());

		await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("URL and port are required for port monitoring");
	});

	it("throws AppError when port is missing", async () => {
		const provider = new PortProvider(createSuccessNet());

		await expect(provider.handle(makeMonitor({ port: undefined }))).rejects.toThrow("URL and port are required for port monitoring");
	});

	it("returns failure with generic message when timeRequest catches non-Error", async () => {
		const socket = {
			setTimeout: jest.fn(),
			on: jest.fn((event: string, cb: Function) => {
				if (event === "error") {
					process.nextTick(() => cb({ notAnError: true }));
				}
			}),
			end: jest.fn(),
			destroy: jest.fn(),
		};
		const net = { createConnection: jest.fn(() => socket) } as any;
		const provider = new PortProvider(net);

		const result = await provider.handle(makeMonitor());

		expect(result.status).toBe(false);
		expect(result.message).toBe("Port check failed");
	});

	it("throws AppError wrapping the original Error message", async () => {
		const provider = new PortProvider(createSuccessNet());

		try {
			await provider.handle(makeMonitor({ url: "" }));
			expect.unreachable("should have thrown");
		} catch (err: any) {
			expect(err.service).toBe("PortProvider");
			expect(err.method).toBe("handle");
		}
	});

	it("throws AppError when an unexpected error occurs in outer try", async () => {
		const provider = new PortProvider(createSuccessNet());
		const monitor = makeMonitor();
		let calls = 0;
		Object.defineProperty(monitor, "url", {
			get() {
				calls++;
				if (calls === 1) throw new Error("getter exploded");
				return "example.com";
			},
		});

		await expect(provider.handle(monitor)).rejects.toThrow("getter exploded");
	});

	it("throws AppError with fallback message when Error has empty message", async () => {
		const provider = new PortProvider(createSuccessNet());
		const monitor = makeMonitor();
		let calls = 0;
		Object.defineProperty(monitor, "url", {
			get() {
				calls++;
				if (calls === 1) throw new Error("");
				return "example.com";
			},
		});

		await expect(provider.handle(monitor)).rejects.toThrow("Error performing port check");
	});

	it("throws AppError with stringified message for non-Error thrown values", async () => {
		const provider = new PortProvider(createSuccessNet());
		const monitor = makeMonitor();
		let calls = 0;
		Object.defineProperty(monitor, "url", {
			get() {
				calls++;
				if (calls === 1) throw 42;
				return "example.com";
			},
		});

		await expect(provider.handle(monitor)).rejects.toThrow("42");
	});
});
