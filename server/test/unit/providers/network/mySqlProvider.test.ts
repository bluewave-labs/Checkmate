import { describe, expect, it, jest } from "@jest/globals";
import { MySqlProvider } from "../../../../src/service/network/MySqlProvider.ts";
import type { MySqlConnection, MySqlConnectionConfig } from "../../../../src/service/network/MySqlProvider.ts";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import { NETWORK_ERROR } from "../../../../src/types/network.ts";
import type { Monitor } from "../../../../src/domain/monitors/monitor.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "mysql",
		url: "db.example.com",
		port: 3306,
		dbUser: "checkmate",
		secret: "hunter2",
		dbName: "app",
		useAdvancedMatching: false,
		...overrides,
	}) as Monitor;

// mysql2 resolves to [rows, fields]
const rowsResult = (rows: unknown[]) => [rows, []];

const passingMatcher = () => ({ validate: jest.fn(() => ({ ok: true, message: "Success" })) }) as any;
const failingMatcher = (message = "Value mismatch") => ({ validate: jest.fn(() => ({ ok: false, message })) }) as any;

const createDriver = (
	opts: {
		result?: unknown;
		connectError?: Error;
		queryError?: Error;
		connectDelayMs?: number;
		endError?: Error;
	} = {}
) => {
	const end = jest.fn(async () => {
		if (opts.endError) throw opts.endError;
	});
	const destroy = jest.fn();
	const query = jest.fn(async () => {
		if (opts.queryError) throw opts.queryError;
		return opts.result ?? rowsResult([{ "1": 1 }]);
	});

	const connection: MySqlConnection = { query, end, destroy } as any;
	const configs: MySqlConnectionConfig[] = [];

	const createConnection = jest.fn(async (config: MySqlConnectionConfig) => {
		configs.push(config);
		if (opts.connectDelayMs) {
			await new Promise((resolve) => setTimeout(resolve, opts.connectDelayMs));
		}
		if (opts.connectError) throw opts.connectError;
		return connection;
	});

	return { driver: { createConnection } as any, createConnection, query, end, destroy, configs };
};

const createProvider = (driverOpts = {}, matcher = passingMatcher()) => {
	const d = createDriver(driverOpts);
	return { provider: new MySqlProvider(d.driver, matcher), ...d, matcher };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("MySqlProvider", {
	create: () => createProvider().provider,
	supportedType: "mysql",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MySqlProvider", () => {
	describe("successful checks", () => {
		it("returns up when the query succeeds", async () => {
			const { provider } = createProvider();

			const result = await provider.handle(makeMonitor());

			expect(result).toEqual(
				expect.objectContaining({
					monitorId: "mon-1",
					teamId: "team-1",
					type: "mysql",
					status: true,
					code: 200,
					message: "MySQL check successful",
				})
			);
		});

		it("defaults to SELECT 1 when no query is configured", async () => {
			const { provider, query } = createProvider();
			await provider.handle(makeMonitor());
			expect(query).toHaveBeenCalledWith("SELECT 1");
		});

		it("runs a configured query instead of the default", async () => {
			const { provider, query } = createProvider();
			await provider.handle(makeMonitor({ dbQuery: "SELECT status FROM health LIMIT 1" }));
			expect(query).toHaveBeenCalledWith("SELECT status FROM health LIMIT 1");
		});

		it("ignores a whitespace-only query and falls back to the default", async () => {
			const { provider, query } = createProvider();
			await provider.handle(makeMonitor({ dbQuery: "   " }));
			expect(query).toHaveBeenCalledWith("SELECT 1");
		});

		it("passes connection settings from the monitor, with the password from secret", async () => {
			const { provider, configs } = createProvider();
			await provider.handle(makeMonitor());
			expect(configs[0]).toEqual(
				expect.objectContaining({
					host: "db.example.com",
					port: 3306,
					user: "checkmate",
					password: "hunter2",
					database: "app",
				})
			);
		});

		it("defaults to port 3306 when the monitor has no port", async () => {
			const { provider, configs } = createProvider();
			await provider.handle(makeMonitor({ port: undefined }));
			expect(configs[0].port).toBe(3306);
		});

		it("reports the response time", async () => {
			const { provider } = createProvider();
			const result = await provider.handle(makeMonitor());
			expect(typeof result.responseTime).toBe("number");
		});
	});

	describe("payload extraction", () => {
		it("extracts the first column of the first row", async () => {
			const { provider } = createProvider({ result: rowsResult([{ status: "healthy" }]) });
			const result = await provider.handle(makeMonitor());
			expect(result.payload).toEqual({ rowCount: 1, value: "healthy" });
		});

		it("counts every returned row", async () => {
			const { provider } = createProvider({ result: rowsResult([{ id: 1 }, { id: 2 }, { id: 3 }]) });
			const result = await provider.handle(makeMonitor());
			expect(result.payload).toEqual(expect.objectContaining({ rowCount: 3, value: "1" }));
		});

		it("stringifies non-string values", async () => {
			const { provider } = createProvider({ result: rowsResult([{ n: 42 }]) });
			const result = await provider.handle(makeMonitor());
			expect(result.payload).toEqual({ rowCount: 1, value: "42" });
		});

		it("represents a SQL NULL as null rather than the string 'null'", async () => {
			const { provider } = createProvider({ result: rowsResult([{ v: null }]) });
			const result = await provider.handle(makeMonitor());
			expect(result.payload).toEqual({ rowCount: 1, value: null });
		});

		it("handles an empty result set", async () => {
			const { provider } = createProvider({ result: rowsResult([]) });
			const result = await provider.handle(makeMonitor());
			expect(result.payload).toEqual({ rowCount: 0 });
		});

		it("handles a driver returning a non-array result", async () => {
			const { provider } = createProvider({ result: { affectedRows: 0 } });
			const result = await provider.handle(makeMonitor());
			expect(result.payload).toEqual({ rowCount: 0 });
		});
	});

	describe("advanced matching", () => {
		it("marks the monitor down when the matcher rejects the value", async () => {
			const { provider } = createProvider({ result: rowsResult([{ status: "degraded" }]) }, failingMatcher("Value mismatch"));

			const result = await provider.handle(makeMonitor({ useAdvancedMatching: true, expectedValue: "healthy" }));

			expect(result.status).toBe(false);
			expect(result.code).toBe(NETWORK_ERROR);
			expect(result.message).toBe("Value mismatch");
		});

		it("hands the extracted value to the matcher", async () => {
			const matcher = passingMatcher();
			const { provider } = createProvider({ result: rowsResult([{ status: "healthy" }]) }, matcher);

			const monitor = makeMonitor({ useAdvancedMatching: true, expectedValue: "healthy" });
			await provider.handle(monitor);

			expect(matcher.validate).toHaveBeenCalledWith("healthy", monitor);
		});

		it("still reports the payload when matching fails", async () => {
			const { provider } = createProvider({ result: rowsResult([{ status: "degraded" }]) }, failingMatcher());
			const result = await provider.handle(makeMonitor({ useAdvancedMatching: true }));
			expect(result.payload).toEqual({ rowCount: 1, value: "degraded" });
		});
	});

	describe("failures", () => {
		it("returns down when the connection is refused", async () => {
			const { provider } = createProvider({ connectError: new Error("ECONNREFUSED") });

			const result = await provider.handle(makeMonitor());

			expect(result).toEqual(
				expect.objectContaining({
					status: false,
					code: NETWORK_ERROR,
					message: "ECONNREFUSED",
					payload: { rowCount: 0 },
				})
			);
		});

		it("returns down when the query fails", async () => {
			const { provider } = createProvider({ queryError: new Error("ER_NO_SUCH_TABLE") });
			const result = await provider.handle(makeMonitor());
			expect(result.status).toBe(false);
			expect(result.message).toBe("ER_NO_SUCH_TABLE");
		});

		it("throws an AppError when the monitor has no url", async () => {
			const { provider } = createProvider();
			await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toMatchObject({
				service: "MySqlProvider",
				method: "handle",
				status: 500,
			});
		});
	});

	// The whole point of this monitor type is that port-pinging 3306 leaves connections
	// open until the server blocks the host, so the provider must never leak one.
	describe("connection cleanup", () => {
		it("closes the connection after a successful query", async () => {
			const { provider, end } = createProvider();
			await provider.handle(makeMonitor());
			await new Promise((resolve) => setImmediate(resolve));
			expect(end).toHaveBeenCalledTimes(1);
		});

		it("closes the connection after a failed query", async () => {
			const { provider, end } = createProvider({ queryError: new Error("boom") });
			await provider.handle(makeMonitor());
			await new Promise((resolve) => setImmediate(resolve));
			expect(end).toHaveBeenCalledTimes(1);
		});

		it("destroys the connection when a graceful close fails", async () => {
			const { provider, destroy } = createProvider({ endError: new Error("already gone") });
			await provider.handle(makeMonitor());
			await new Promise((resolve) => setImmediate(resolve));
			expect(destroy).toHaveBeenCalled();
		});

		it("does not attempt to close when the connection never opened", async () => {
			const { provider, end, destroy } = createProvider({ connectError: new Error("ECONNREFUSED") });
			await provider.handle(makeMonitor());
			await new Promise((resolve) => setImmediate(resolve));
			expect(end).not.toHaveBeenCalled();
			expect(destroy).not.toHaveBeenCalled();
		});
	});

	describe("timeout", () => {
		it("gives up on a hung connection", async () => {
			jest.useFakeTimers();
			try {
				const { provider } = createProvider({ connectDelayMs: 30_000 });

				const pending = provider.handle(makeMonitor());
				await jest.advanceTimersByTimeAsync(10_000);
				const result = await pending;

				expect(result.status).toBe(false);
				expect(result.message).toBe("MySQL check timed out");
			} finally {
				jest.useRealTimers();
			}
		});

		// The connection that was still opening when we gave up must not be left dangling —
		// that is precisely the leak this monitor type exists to avoid.
		it("closes a connection that finishes opening after the timeout fired", async () => {
			jest.useFakeTimers();
			try {
				const { provider, end } = createProvider({ connectDelayMs: 30_000 });

				const pending = provider.handle(makeMonitor());
				await jest.advanceTimersByTimeAsync(10_000);
				await pending;
				expect(end).not.toHaveBeenCalled();

				await jest.advanceTimersByTimeAsync(25_000);
				expect(end).toHaveBeenCalledTimes(1);
			} finally {
				jest.useRealTimers();
			}
		});
	});
});
