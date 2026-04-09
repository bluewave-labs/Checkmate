import { describe, expect, it, jest } from "@jest/globals";
import { GrpcProvider } from "../../../src/service/infrastructure/network/GrpcProvider.ts";
import { testStatusProviderContract } from "../../helpers/statusProviderContract.ts";
import type { Monitor } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "grpc",
		url: "grpc.example.com",
		port: 50051,
		grpcServiceName: "my.Service",
		ignoreTlsErrors: false,
		...overrides,
	}) as Monitor;

const createMockClient = (behavior: "serving" | "not-serving" | "error" | "grpc-error" = "serving") => {
	const close = jest.fn();
	const Check = jest.fn((_req: any, _opts: any, cb: Function) => {
		if (behavior === "serving") {
			cb(null, { status: "SERVING" });
		} else if (behavior === "not-serving") {
			cb(null, { status: "NOT_SERVING" });
		} else if (behavior === "error") {
			cb({ code: 14, details: "Connection refused", message: "unavailable" });
		} else if (behavior === "grpc-error") {
			cb({ code: 2, message: "Unknown error" });
		}
	});
	return { Check, close };
};

const createMockGrpc = (client?: ReturnType<typeof createMockClient>) => {
	const c = client ?? createMockClient();
	const Health = jest.fn().mockReturnValue(c);

	return {
		grpc: {
			loadPackageDefinition: jest.fn().mockReturnValue({
				grpc: { health: { v1: { Health } } },
			}),
			credentials: {
				createInsecure: jest.fn().mockReturnValue("insecure-creds"),
				createSsl: jest.fn().mockReturnValue("ssl-creds"),
			},
		},
		protoLoader: {
			loadSync: jest.fn().mockReturnValue({}),
		},
		Health,
		client: c,
	};
};

const createProvider = (opts?: { behavior?: "serving" | "not-serving" | "error" | "grpc-error" }) => {
	const client = createMockClient(opts?.behavior ?? "serving");
	const mocks = createMockGrpc(client);
	const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);
	return { provider, ...mocks, client };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("GrpcProvider", {
	create: () => createProvider().provider,
	supportedType: "grpc",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GrpcProvider", () => {
	// ── Success paths ────────────────────────────────────────────────────

	describe("success responses", () => {
		it("returns healthy status for SERVING response", async () => {
			const { provider } = createProvider({ behavior: "serving" });

			const result = await provider.handle(makeMonitor());

			expect(result).toEqual(
				expect.objectContaining({
					monitorId: "mon-1",
					teamId: "team-1",
					type: "grpc",
					status: true,
					code: 200,
					message: expect.stringContaining("SERVING"),
				})
			);
			expect(result.payload).toEqual(
				expect.objectContaining({
					grpcStatusCode: 0,
					grpcStatusName: "OK",
					serviceName: "my.Service",
					servingStatus: "SERVING",
				})
			);
		});

		it("returns unhealthy status for NOT_SERVING response", async () => {
			const { provider } = createProvider({ behavior: "not-serving" });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
			expect(result.code).toBe(5000);
			expect(result.message).toContain("NOT_SERVING");
		});

		it("defaults to UNKNOWN when response has no status", async () => {
			const client = { Check: jest.fn((_r: any, _o: any, cb: Function) => cb(null, {})), close: jest.fn() };
			const mocks = createMockGrpc(client as any);
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			const result = await provider.handle(makeMonitor());

			expect(result.payload).toEqual(expect.objectContaining({ servingStatus: "UNKNOWN" }));
		});

		it("defaults to UNKNOWN when response is undefined", async () => {
			const client = { Check: jest.fn((_r: any, _o: any, cb: Function) => cb(null, undefined)), close: jest.fn() };
			const mocks = createMockGrpc(client as any);
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			const result = await provider.handle(makeMonitor());

			expect(result.payload).toEqual(expect.objectContaining({ servingStatus: "UNKNOWN" }));
		});
	});

	// ── gRPC errors ──────────────────────────────────────────────────────

	describe("gRPC errors", () => {
		it("returns failure with gRPC error details", async () => {
			const { provider } = createProvider({ behavior: "error" });

			const result = await provider.handle(makeMonitor());

			expect(result.status).toBe(false);
			expect(result.code).toBe(14);
			expect(result.message).toBe("Connection refused");
			expect(result.payload).toEqual(
				expect.objectContaining({
					grpcStatusCode: 14,
					grpcStatusName: "UNAVAILABLE",
					servingStatus: "UNKNOWN",
				})
			);
		});

		it("falls back to message when details is missing", async () => {
			const client = {
				Check: jest.fn((_r: any, _o: any, cb: Function) => cb({ code: 2, message: "Unknown error" })),
				close: jest.fn(),
			};
			const mocks = createMockGrpc(client as any);
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			const result = await provider.handle(makeMonitor());

			expect(result.message).toBe("Unknown error");
		});

		it("uses default message and code when error has no code/details/message", async () => {
			const client = {
				Check: jest.fn((_r: any, _o: any, cb: Function) => cb({})),
				close: jest.fn(),
			};
			const mocks = createMockGrpc(client as any);
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			const result = await provider.handle(makeMonitor());

			expect(result.code).toBe(5000);
			expect(result.message).toBe("gRPC error");
			expect(result.payload).toEqual(expect.objectContaining({ grpcStatusCode: -1, grpcStatusName: "UNKNOWN" }));
		});

		it("defaults grpcCode to 5000 when error has no grpcCode", async () => {
			const client = {
				Check: jest.fn((_r: any, _o: any, cb: Function) => {
					const err = new Error("test") as any;
					// no grpcPayload or grpcCode
					cb(err);
				}),
				close: jest.fn(),
			};
			const mocks = createMockGrpc(client as any);
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			const result = await provider.handle(makeMonitor());

			expect(result.code).toBe(5000);
		});

		it("includes grpcPayload in error result", async () => {
			const { provider } = createProvider({ behavior: "error" });

			const result = await provider.handle(makeMonitor());

			expect(result.payload).toEqual(
				expect.objectContaining({
					grpcStatusCode: 14,
					grpcStatusName: "UNAVAILABLE",
				})
			);
		});

		it("defaults code, message, and payload when error lacks gRPC properties", async () => {
			// client.Check throws synchronously — timeRequest catches a plain object with no gRPC props
			const client = {
				Check: jest.fn(() => {
					throw { unexpected: true };
				}),
				close: jest.fn(),
			};
			const mocks = createMockGrpc(client as any);
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			const result = await provider.handle(makeMonitor());

			expect(result.code).toBe(5000);
			expect(result.message).toBe("gRPC health check failed");
			expect(result.payload).toBeNull();
		});
	});

	// ── Credentials ──────────────────────────────────────────────────────

	describe("credentials", () => {
		it("uses insecure credentials by default", async () => {
			const { provider, grpc } = createProvider();

			await provider.handle(makeMonitor({ ignoreTlsErrors: false }));

			expect(grpc.credentials.createInsecure).toHaveBeenCalled();
		});

		it("uses SSL credentials with checkServerIdentity override when ignoreTlsErrors is true", async () => {
			const { provider, grpc } = createProvider();

			await provider.handle(makeMonitor({ ignoreTlsErrors: true }));

			expect(grpc.credentials.createSsl).toHaveBeenCalledWith(null, null, null, {
				checkServerIdentity: expect.any(Function),
			});

			// Verify checkServerIdentity returns undefined
			const opts = (grpc.credentials.createSsl as jest.Mock).mock.calls[0][3];
			expect(opts.checkServerIdentity()).toBeUndefined();
		});
	});

	// ── URL parsing ──────────────────────────────────────────────────────

	describe("URL and target construction", () => {
		it("strips protocol from URL", async () => {
			const { provider, Health } = createProvider();

			await provider.handle(makeMonitor({ url: "https://grpc.example.com", port: 443 }));

			expect(Health).toHaveBeenCalledWith("grpc.example.com:443", expect.anything());
		});

		it("uses grpcServiceName in Check request", async () => {
			const { provider, client } = createProvider();

			await provider.handle(makeMonitor({ grpcServiceName: "health.v1" }));

			expect(client.Check).toHaveBeenCalledWith(
				{ service: "health.v1" },
				expect.objectContaining({ deadline: expect.any(Date) }),
				expect.any(Function)
			);
		});

		it("defaults grpcServiceName to empty string when not set", async () => {
			const { provider, client } = createProvider();

			await provider.handle(makeMonitor({ grpcServiceName: undefined }));

			expect(client.Check).toHaveBeenCalledWith({ service: "" }, expect.anything(), expect.any(Function));
		});
	});

	// ── Validation ───────────────────────────────────────────────────────

	describe("validation", () => {
		it("throws AppError when url is missing", async () => {
			const { provider } = createProvider();

			await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("Monitor host is required");
		});

		it("throws AppError when port is missing", async () => {
			const { provider } = createProvider();

			await expect(provider.handle(makeMonitor({ port: undefined }))).rejects.toThrow("Monitor port is required");
		});
	});

	// ── Outer catch ──────────────────────────────────────────────────────

	describe("outer error handling", () => {
		it("throws AppError when protoLoader.loadSync throws", async () => {
			const mocks = createMockGrpc();
			mocks.protoLoader.loadSync = jest.fn().mockImplementation(() => {
				throw new Error("Proto file not found");
			});
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			await expect(provider.handle(makeMonitor())).rejects.toThrow("Proto file not found");
		});

		it("throws AppError with default message when Error has empty message", async () => {
			const mocks = createMockGrpc();
			mocks.protoLoader.loadSync = jest.fn().mockImplementation(() => {
				throw new Error("");
			});
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing gRPC health check");
		});

		it("throws AppError with stringified message for non-Error thrown values", async () => {
			const mocks = createMockGrpc();
			mocks.protoLoader.loadSync = jest.fn().mockImplementation(() => {
				throw "proto load failed";
			});
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			await expect(provider.handle(makeMonitor())).rejects.toThrow("proto load failed");
		});
	});

	// ── getGrpcStatusName ────────────────────────────────────────────────

	describe("gRPC status name mapping", () => {
		const statusCodes: [number, string][] = [
			[0, "OK"],
			[1, "CANCELLED"],
			[2, "UNKNOWN"],
			[3, "INVALID_ARGUMENT"],
			[4, "DEADLINE_EXCEEDED"],
			[5, "NOT_FOUND"],
			[6, "ALREADY_EXISTS"],
			[7, "PERMISSION_DENIED"],
			[8, "RESOURCE_EXHAUSTED"],
			[9, "FAILED_PRECONDITION"],
			[10, "ABORTED"],
			[11, "OUT_OF_RANGE"],
			[12, "UNIMPLEMENTED"],
			[13, "INTERNAL"],
			[14, "UNAVAILABLE"],
			[15, "DATA_LOSS"],
			[16, "UNAUTHENTICATED"],
			[99, "UNKNOWN"],
		];

		it.each(statusCodes)("maps gRPC code %i to %s", async (code, expectedName) => {
			const client = {
				Check: jest.fn((_r: any, _o: any, cb: Function) => cb({ code, details: "test" })),
				close: jest.fn(),
			};
			const mocks = createMockGrpc(client as any);
			const provider = new GrpcProvider(mocks.grpc as any, mocks.protoLoader as any);

			const result = await provider.handle(makeMonitor());

			expect(result.payload).toEqual(expect.objectContaining({ grpcStatusName: expectedName }));
		});
	});
});
