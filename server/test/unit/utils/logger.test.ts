import { afterEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import type { AddressInfo } from "node:net";
import Logger from "../../../src/utils/logger/logger.ts";
import { logContext } from "../../../src/utils/logger/logContext.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// Captures what the logger writes to stdout. pino's multistream calls process.stdout.write per line.
const setup = (level = "debug") => {
	const lines: string[] = [];
	jest.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
		lines.push(chunk.toString());
		return true;
	});
	const logger = new Logger();
	logger.setLogLevel(level);
	const parsed = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
	return { logger, lines, parsed };
};

afterEach(() => {
	jest.restoreAllMocks();
});

describe("Logger", () => {
	it("writes one JSON line with level label, message, timestamp, service and method", () => {
		const { logger, lines, parsed } = setup();

		logger.info({ message: "hello", service: "TestService", method: "run", details: { a: 1 } });

		expect(lines).toHaveLength(1);
		expect(lines[0]?.endsWith("\n")).toBe(true);
		const [entry] = parsed();
		expect(entry).toMatchObject({ level: "info", message: "hello", service: "TestService", method: "run", details: { a: 1 } });
		expect(typeof entry?.timestamp).toBe("string");
		expect(Number.isNaN(Date.parse(String(entry?.timestamp)))).toBe(false);
		expect(entry).not.toHaveProperty("pid");
		expect(entry).not.toHaveProperty("hostname");
	});

	it("keeps a multi-line stack on one line, under err", () => {
		const { logger, lines, parsed } = setup();

		logger.error({ message: "boom", service: "TestService", stack: "Error: boom\n    at a (x.ts:1:1)\n    at b (y.ts:2:2)" });

		expect(lines).toHaveLength(1);
		expect(lines[0]?.trimEnd().includes("\n")).toBe(false);
		const [entry] = parsed();
		expect(entry).toMatchObject({ level: "error", err: { stack: "Error: boom\n    at a (x.ts:1:1)\n    at b (y.ts:2:2)" } });
		expect(entry).not.toHaveProperty("stack");
	});

	it("omits err when no stack is given", () => {
		const { logger, parsed } = setup();

		logger.warn({ message: "no stack" });

		expect(parsed()[0]).not.toHaveProperty("err");
	});

	it("filters lines below the configured level", () => {
		const { logger, parsed } = setup("warn");

		logger.debug({ message: "debug" });
		logger.info({ message: "info" });
		logger.warn({ message: "warn" });
		logger.error({ message: "error" });

		expect(parsed().map((entry) => entry.level)).toEqual(["warn", "error"]);
		expect(logger.getLogs().map((entry) => entry.level)).toEqual(["warn", "error"]);
	});

	it("delivers debug lines to both stdout and the log cache", () => {
		const { logger, parsed } = setup("debug");

		logger.debug({ message: "debug line", service: "TestService" });

		expect(parsed()).toHaveLength(1);
		expect(logger.getLogs()).toEqual([expect.objectContaining({ level: "debug", message: "debug line", service: "TestService" })]);
	});

	it("caches entries in LogEntry shape, with the stack read back from err", () => {
		const { logger } = setup();

		logger.error({ message: "boom", service: "TestService", method: "run", details: { a: 1 }, stack: "Error: boom" });

		expect(logger.getLogs()).toEqual([
			{
				level: "error",
				message: "boom",
				timestamp: expect.any(String),
				service: "TestService",
				method: "run",
				details: { a: 1 },
				stack: "Error: boom",
			},
		]);
	});

	it("caps the log cache at 1000 entries, dropping the oldest", () => {
		const { logger } = setup();

		for (let i = 0; i < 1005; i++) {
			logger.info({ message: `line ${i}` });
		}

		const logs = logger.getLogs();
		expect(logs).toHaveLength(1000);
		expect(logs[0]?.message).toBe("line 5");
		expect(logs[999]?.message).toBe("line 1004");
	});

	it("redacts secrets at the top level, one level down and two levels down", () => {
		const { logger, parsed } = setup();

		logger.info({ message: "secrets", details: { token: "t", keep: "ok", user: { password: "p" } } });

		const [entry] = parsed();
		expect(entry?.details).toEqual({ token: "[Redacted]", keep: "ok", user: { password: "[Redacted]" } });
		expect(logger.getLogs()[0]?.details).toEqual({ token: "[Redacted]", keep: "ok", user: { password: "[Redacted]" } });
	});

	it("adds the current log context to each line, and nothing outside it", () => {
		const { logger, parsed } = setup();

		logContext.run({ reqId: "r1" }, () => logger.info({ message: "inside" }));
		logger.info({ message: "outside" });

		const [inside, outside] = parsed();
		expect(inside).toMatchObject({ message: "inside", reqId: "r1" });
		expect(outside).not.toHaveProperty("reqId");
	});

	it("merges top-level context into the cached details of a legacy line", () => {
		const { logger } = setup();

		logContext.run({ reqId: "r1" }, () => logger.warn({ message: "with details", details: { a: 1 } }));
		logContext.run({ reqId: "r2" }, () => logger.warn({ message: "without details" }));

		expect(logger.getLogs().map((entry) => entry.details)).toEqual([{ reqId: "r1", a: 1 }, { reqId: "r2" }]);
	});

	it("keeps a legacy line's own details value when it clashes with context", () => {
		const { logger } = setup();

		logContext.run({ reqId: "from-context" }, () => logger.info({ message: "clash", details: { reqId: "from-details" } }));

		expect(logger.getLogs()[0]?.details).toEqual({ reqId: "from-details" });
	});

	it("keeps pino-http request lines out of the cache, but not lines that merely log a responseTime", () => {
		const { logger, parsed } = setup();
		const pinoLogger = (logger as unknown as { pino: { info: (obj: object, msg: string) => void } }).pino;

		pinoLogger.info({ httpRequest: { id: "r1" }, httpResponse: { statusCode: 200 }, httpDurationMs: 3 }, "GET /api/v1/x 200 3ms");
		logger.info({ message: "check completed", details: { responseTime: 42 } });

		expect(parsed()).toHaveLength(2);
		expect(logger.getLogs().map((entry) => entry.message)).toEqual(["check completed"]);
	});
});

describe("Logger.httpMiddleware", () => {
	// A minimal app wired like app.ts: pino-http first, then the context middleware, then a route that logs.
	const setupApp = async () => {
		const { logger, parsed } = setup();
		const app = express();
		app.use(logger.httpMiddleware());
		app.use((req, _res, next) => logContext.run({ reqId: String(req.id) }, next));
		app.get("/api/v1/ok", (_req, res) => {
			logger.info({ message: "handler line" });
			res.json({ ok: true });
		});
		app.get("/api/v1/health", (_req, res) => {
			res.json({ ok: true });
		});
		app.get("/static.js", (_req, res) => {
			res.send("// js");
		});
		const server = app.listen(0);
		await new Promise((resolve) => server.once("listening", resolve));
		const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
		const request = async (path: string, headers?: Record<string, string>) => {
			const response = await fetch(`${base}${path}`, { headers });
			await response.text();
			await new Promise((resolve) => setImmediate(resolve)); // let pino-http's finish handler write its line
			return response;
		};
		const close = () => new Promise((resolve) => server.close(resolve));
		const requestLines = () => parsed().filter((line) => "httpRequest" in line);
		return { logger, parsed, request, requestLines, close };
	};

	it("returns a generated X-Request-Id and logs the same id", async () => {
		const { request, requestLines, close } = await setupApp();
		try {
			const response = await request("/api/v1/ok");

			const id = response.headers.get("x-request-id");
			expect(id).toMatch(/^[0-9a-f-]{36}$/);
			expect(requestLines()[0]?.httpRequest).toEqual({ id, method: "GET", url: "/api/v1/ok" });
		} finally {
			await close();
		}
	});

	it("echoes a valid incoming X-Request-Id and replaces an invalid one", async () => {
		const { request, close } = await setupApp();
		try {
			const valid = await request("/api/v1/ok", { "X-Request-Id": "proxy-abc.123" });
			const invalid = await request("/api/v1/ok", { "X-Request-Id": "has spaces in it" });

			expect(valid.headers.get("x-request-id")).toBe("proxy-abc.123");
			expect(invalid.headers.get("x-request-id")).not.toBe("has spaces in it");
			expect(invalid.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
		} finally {
			await close();
		}
	});

	it("logs a 200 at debug and a 404 at warn, with the summary as the message", async () => {
		const { request, requestLines, close } = await setupApp();
		try {
			await request("/api/v1/ok");
			await request("/api/v1/missing");

			const [ok, missing] = requestLines();
			expect(ok).toMatchObject({ level: "debug", httpResponse: { statusCode: 200 }, httpDurationMs: expect.any(Number) });
			expect(ok?.message).toMatch(/^GET \/api\/v1\/ok 200 \d+ms$/);
			expect(missing).toMatchObject({ level: "warn", httpResponse: { statusCode: 404 } });
		} finally {
			await close();
		}
	});

	it("logs no request headers and no response headers", async () => {
		const { request, requestLines, close } = await setupApp();
		try {
			await request("/api/v1/ok", { Authorization: "Bearer secret-token" });

			const line = JSON.stringify(requestLines()[0]);
			expect(line).not.toContain("secret-token");
			expect(line).not.toContain("headers");
		} finally {
			await close();
		}
	});

	it("does not log non-API requests or the health probe", async () => {
		const { request, requestLines, close } = await setupApp();
		try {
			await request("/static.js");
			await request("/api/v1/health");

			expect(requestLines()).toHaveLength(0);
		} finally {
			await close();
		}
	});

	it("tags lines logged by a route handler with the request's id", async () => {
		const { request, parsed, close } = await setupApp();
		try {
			const response = await request("/api/v1/ok");

			const handlerLine = parsed().find((line) => line.message === "handler line");
			expect(handlerLine?.reqId).toBe(response.headers.get("x-request-id"));
		} finally {
			await close();
		}
	});

	it("keeps request lines out of the log cache", async () => {
		const { request, logger, close } = await setupApp();
		try {
			await request("/api/v1/ok");

			expect(logger.getLogs().map((entry) => entry.message)).toEqual(["handler line"]);
		} finally {
			await close();
		}
	});
});

describe("Logger call forms", () => {
	it("writes (fields, message) with the fields at the top level", () => {
		const { logger, parsed } = setup();

		logger.warn({ notificationIds: ["n1", "n2"] }, "channel failed to deliver");

		const [entry] = parsed();
		expect(entry).toMatchObject({ level: "warn", message: "channel failed to deliver", notificationIds: ["n1", "n2"] });
		expect(entry).not.toHaveProperty("details");
	});

	it("writes a message on its own", () => {
		const { logger, parsed } = setup();

		logger.info("server started");

		expect(parsed()[0]).toMatchObject({ level: "info", message: "server started" });
	});

	it("serializes an error passed as err", () => {
		const { logger, parsed } = setup();

		logger.error({ err: new Error("boom") }, "send failed");

		expect(parsed()[0]?.err).toMatchObject({ type: "Error", message: "boom", stack: expect.stringContaining("Error: boom") });
		expect(logger.getLogs()[0]?.stack).toEqual(expect.stringContaining("Error: boom"));
	});

	it("caches both forms in the same LogEntry shape", () => {
		const { logger } = setup();

		logger.info({ message: "legacy", service: "TestService", details: { a: 1 } });
		logger.child({ service: "TestService" }).info({ a: 1 }, "new");

		const [legacy, current] = logger.getLogs();
		expect(legacy).toMatchObject({ message: "legacy", service: "TestService", details: { a: 1 } });
		expect(current).toMatchObject({ message: "new", service: "TestService", details: { a: 1 } });
	});

	it("still accepts the legacy object alongside the new forms", () => {
		const { logger, parsed } = setup();

		logger.info({ message: "legacy", service: "TestService", method: "run" });
		logger.info({ a: 1 }, "new");

		expect(parsed().map((entry) => entry.message)).toEqual(["legacy", "new"]);
		expect(parsed()[0]).toMatchObject({ service: "TestService", method: "run" });
	});
});

describe("Logger.child", () => {
	it("adds its bindings to its own lines only", () => {
		const { logger, parsed } = setup();
		const child = logger.child({ service: "ChildService" });

		child.info("from child");
		logger.info("from parent");

		const [fromChild, fromParent] = parsed();
		expect(fromChild).toMatchObject({ service: "ChildService", message: "from child" });
		expect(fromParent).not.toHaveProperty("service");
	});

	it("keeps both sets of bindings on a child of a child", () => {
		const { logger, parsed } = setup();

		logger.child({ service: "ChildService" }).child({ monitorId: "m1" }).info("nested");

		expect(parsed()[0]).toMatchObject({ service: "ChildService", monitorId: "m1", message: "nested" });
	});

	it("writes into the parent's cache and shares getLogs()", () => {
		const { logger } = setup();
		const child = logger.child({ service: "ChildService" });

		child.info({ a: 1 }, "from child");

		expect(child.getLogs()).toBe(logger.getLogs());
		expect(logger.getLogs()).toEqual([expect.objectContaining({ message: "from child", service: "ChildService", details: { a: 1 } })]);
	});

	it("follows the root logger's level", () => {
		const { logger, parsed } = setup("warn");

		logger.child({ service: "ChildService" }).info("dropped");
		logger.child({ service: "ChildService" }).warn("kept");

		expect(parsed().map((entry) => entry.message)).toEqual(["kept"]);
	});

	it("carries the current log context like the root logger", () => {
		const { logger, parsed } = setup();
		const child = logger.child({ service: "ChildService" });

		logContext.run({ jobId: "check:m1", jobType: "check" }, () => child.info("in job"));

		expect(parsed()[0]).toMatchObject({ service: "ChildService", jobId: "check:m1", jobType: "check" });
	});
});

describe("createMockLogger", () => {
	it("returns itself from child(), so assertions on a migrated service's logger still hit the same spies", () => {
		const mock = createMockLogger();

		const child = mock.child({ service: "TestService" });
		child.warn({ a: 1 }, "message");

		expect(child).toBe(mock);
		expect(mock.child).toHaveBeenCalledWith({ service: "TestService" });
		expect(mock.warn).toHaveBeenCalledWith({ a: 1 }, "message");
	});
});
