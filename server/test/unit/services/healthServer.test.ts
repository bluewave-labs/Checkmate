import { afterEach, describe, expect, it } from "@jest/globals";
import http from "http";
import net from "net";
import { HealthServer } from "../../../src/worker/worker.health-server.ts";
import type { WorkerHealth } from "../../../src/worker/worker.interface.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Notes ──────────────────────────────────────────────────────────────────────
//
// HealthServer is a dumb bare-http listener over the worker's getHealth() snapshot:
// it maps the snapshot to 200/503 per endpoint and serves the snapshot as the body.
// We drive it end-to-end with real sockets and a stub worker, so REAL timers are used
// (Date.now() drives the /livez staleness check) — no fake timers in this file.
//
// listen() binds `Number(port) || 52346`, so "0" would resolve to 52346, not an
// ephemeral port. We discover a free port first and pass it as a concrete string.

const freePort = (): Promise<number> =>
	new Promise((resolve, reject) => {
		const srv = net.createServer();
		srv.once("error", reject);
		srv.listen(0, () => {
			const addr = srv.address();
			const port = typeof addr === "object" && addr ? addr.port : 0;
			srv.close(() => resolve(port));
		});
	});

const get = (port: number, path: string): Promise<{ status: number; body: string; contentType: string }> =>
	new Promise((resolve, reject) => {
		http
			.get({ host: "127.0.0.1", port, path }, (res) => {
				let body = "";
				res.on("data", (chunk) => (body += chunk));
				res.on("end", () => resolve({ status: res.statusCode ?? 0, body, contentType: String(res.headers["content-type"] ?? "") }));
			})
			.on("error", reject);
	});

// Fresh, fully-healthy snapshot; override per test. lastTickAt is stamped at call time
// so it is "recent" relative to the request that follows a moment later.
const makeHealth = (over?: Partial<WorkerHealth>): WorkerHealth => ({
	workerId: "worker-1",
	mode: "worker",
	dbConnected: true,
	initComplete: true,
	draining: false,
	lastTickAt: Date.now(),
	inFlight: 0,
	...over,
});

describe("HealthServer", () => {
	let active: HealthServer | null = null;

	afterEach(async () => {
		if (active) await active.close();
		active = null;
	});

	// The metrics endpoint also calls countDueBacklog()/countAliveWorkers(); default them
	// to 0 and let tests override (including to a rejection, to exercise the 500 path).
	const setup = async (health: WorkerHealth, workerOverrides: Record<string, unknown> = {}) => {
		const port = await freePort();
		const worker = {
			getHealth: () => health,
			countDueBacklog: async () => 0,
			countAliveWorkers: async () => 0,
			...workerOverrides,
		} as any;
		const server = new HealthServer(createMockLogger(), String(port), worker);
		await server.listen();
		active = server;
		return { port };
	};

	describe("/livez", () => {
		it("200 when init complete and a tick is recent", async () => {
			const { port } = await setup(makeHealth());
			expect((await get(port, "/livez")).status).toBe(200);
		});

		it("503 before init completes", async () => {
			const { port } = await setup(makeHealth({ initComplete: false }));
			expect((await get(port, "/livez")).status).toBe(503);
		});

		it("503 when it has never ticked", async () => {
			const { port } = await setup(makeHealth({ lastTickAt: null }));
			expect((await get(port, "/livez")).status).toBe(503);
		});

		it("503 when the last tick is stale and not draining", async () => {
			const { port } = await setup(makeHealth({ lastTickAt: Date.now() - 31_000 }));
			expect((await get(port, "/livez")).status).toBe(503);
		});

		it("200 when draining even if ticks are stale (drain must read as live)", async () => {
			const { port } = await setup(makeHealth({ draining: true, lastTickAt: Date.now() - 60_000 }));
			expect((await get(port, "/livez")).status).toBe(200);
		});
	});

	describe("/readyz", () => {
		it("200 when init complete, db connected, and not draining", async () => {
			const { port } = await setup(makeHealth());
			expect((await get(port, "/readyz")).status).toBe(200);
		});

		it("503 while draining", async () => {
			const { port } = await setup(makeHealth({ draining: true }));
			expect((await get(port, "/readyz")).status).toBe(503);
		});

		it("503 when the db is disconnected", async () => {
			const { port } = await setup(makeHealth({ dbConnected: false }));
			expect((await get(port, "/readyz")).status).toBe(503);
		});

		it("503 before init completes", async () => {
			const { port } = await setup(makeHealth({ initComplete: false }));
			expect((await get(port, "/readyz")).status).toBe(503);
		});
	});

	describe("routing & body", () => {
		it("serves the WorkerHealth snapshot as the JSON body", async () => {
			const { port } = await setup(makeHealth({ inFlight: 3 }));
			const res = await get(port, "/readyz");
			expect(JSON.parse(res.body)).toMatchObject({ workerId: "worker-1", mode: "worker", inFlight: 3 });
		});

		it("404s unknown paths", async () => {
			const { port } = await setup(makeHealth());
			expect((await get(port, "/nope")).status).toBe(404);
		});

		it("ignores query params when matching the route", async () => {
			const { port } = await setup(makeHealth());
			expect((await get(port, "/livez?probe=1")).status).toBe(200);
		});
	});

	describe("/metrics", () => {
		it("200 with prometheus content-type and all four gauges", async () => {
			const { port } = await setup(makeHealth({ inFlight: 3, draining: false }), {
				countDueBacklog: async () => 5,
				countAliveWorkers: async () => 2,
			});
			const res = await get(port, "/metrics");

			expect(res.status).toBe(200);
			expect(res.contentType).toMatch(/text\/plain/);
			expect(res.body).toContain("# TYPE checkmate_worker_due_backlog gauge");
			expect(res.body).toContain("checkmate_worker_jobs_in_flight 3");
			expect(res.body).toContain("checkmate_worker_due_backlog 5");
			expect(res.body).toContain("checkmate_worker_alive_total 2");
			expect(res.body).toContain("checkmate_worker_draining 0");
		});

		it("reports draining as 1 when the worker is draining", async () => {
			const { port } = await setup(makeHealth({ draining: true }));
			expect((await get(port, "/metrics")).body).toContain("checkmate_worker_draining 1");
		});

		it("500 when a metrics query fails", async () => {
			const { port } = await setup(makeHealth(), {
				countDueBacklog: async () => {
					throw new Error("db down");
				},
			});
			expect((await get(port, "/metrics")).status).toBe(500);
		});
	});

	describe("listen", () => {
		it("walks to the next port when the configured one is in use", async () => {
			const base = await freePort();
			// Hold the base port so the health server's first bind hits EADDRINUSE.
			const blocker = net.createServer();
			await new Promise<void>((resolve) => blocker.listen(base, resolve));

			try {
				const worker = { getHealth: () => makeHealth(), countDueBacklog: async () => 0, countAliveWorkers: async () => 0 } as any;
				const server = new HealthServer(createMockLogger(), String(base), worker);
				await server.listen();
				active = server;

				// base is still held by the blocker, so the health server retried onto a higher port and is reachable there.
				const addr = server.address();
				const bound = typeof addr === "object" && addr ? addr.port : 0;
				expect(bound).toBeGreaterThan(base);
				expect((await get(bound, "/livez")).status).toBe(200);
			} finally {
				await new Promise<void>((resolve) => blocker.close(() => resolve()));
			}
		});
	});
});
