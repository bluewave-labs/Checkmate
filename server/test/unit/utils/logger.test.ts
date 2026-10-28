import { afterEach, describe, expect, it, jest } from "@jest/globals";
import express from "express";
import got from "got";
import http from "node:http";
import type { AddressInfo } from "node:net";
import Logger from "../../../src/utils/logger/logger.ts";
import { AppError } from "../../../src/utils/AppError.ts";
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
	it("writes one JSON line with level label, message, timestamp, service and fields", () => {
		const { logger, lines, parsed } = setup();

		logger.child({ service: "TestService" }).info({ a: 1 }, "hello");

		expect(lines).toHaveLength(1);
		expect(lines[0]?.endsWith("\n")).toBe(true);
		const [entry] = parsed();
		expect(entry).toMatchObject({ level: "info", message: "hello", service: "TestService", a: 1 });
		expect(typeof entry?.timestamp).toBe("string");
		expect(Number.isNaN(Date.parse(String(entry?.timestamp)))).toBe(false);
		expect(entry).not.toHaveProperty("pid");
		expect(entry).not.toHaveProperty("hostname");
		expect(entry).not.toHaveProperty("method");
	});

	it("keeps a multi-line stack on one line, under err", () => {
		const { logger, lines, parsed } = setup();
		const error = new Error("boom");
		error.stack = "Error: boom\n    at a (x.ts:1:1)\n    at b (y.ts:2:2)";

		logger.error({ err: error }, "boom");

		expect(lines).toHaveLength(1);
		expect(lines[0]?.trimEnd().includes("\n")).toBe(false);
		const [entry] = parsed();
		expect(entry).toMatchObject({ level: "error", err: { stack: "Error: boom\n    at a (x.ts:1:1)\n    at b (y.ts:2:2)" } });
		expect(entry).not.toHaveProperty("stack");
	});

	it("omits err when none is given", () => {
		const { logger, parsed } = setup();

		logger.warn("no error");

		expect(parsed()[0]).not.toHaveProperty("err");
	});

	it("filters lines below the configured level", () => {
		const { logger, parsed } = setup("warn");

		logger.debug("debug");
		logger.info("info");
		logger.warn("warn");
		logger.error("error");

		expect(parsed().map((entry) => entry.level)).toEqual(["warn", "error"]);
		expect(logger.getLogs().map((entry) => entry.level)).toEqual(["warn", "error"]);
	});

	it("delivers debug lines to both stdout and the log cache", () => {
		const { logger, parsed } = setup("debug");

		logger.child({ service: "TestService" }).debug("debug line");

		expect(parsed()).toHaveLength(1);
		expect(logger.getLogs()).toEqual([expect.objectContaining({ level: "debug", message: "debug line", service: "TestService" })]);
	});

	it("caches entries in LogEntry shape, with the stack read back from err", () => {
		const { logger } = setup();
		const error = new Error("boom");

		logger.child({ service: "TestService" }).error({ err: error, a: 1 }, "boom");

		expect(logger.getLogs()).toEqual([
			{
				level: "error",
				message: "boom",
				timestamp: expect.any(String),
				service: "TestService",
				details: { a: 1 },
				stack: error.stack,
			},
		]);
	});

	it("caps the log cache at 1000 entries, dropping the oldest", () => {
		const { logger } = setup();

		for (let i = 0; i < 1005; i++) {
			logger.info({ index: i }, "line");
		}

		const logs = logger.getLogs();
		expect(logs).toHaveLength(1000);
		expect(logs[0]?.details).toEqual({ index: 5 });
		expect(logs[999]?.details).toEqual({ index: 1004 });
	});

	it("redacts secrets at the top level, one level down and two levels down", () => {
		const { logger, parsed } = setup();

		logger.info({ token: "t", keep: "ok", details: { password: "p", user: { password: "p" } } }, "secrets");

		const [entry] = parsed();
		expect(entry).toMatchObject({ token: "[Redacted]", keep: "ok", details: { password: "[Redacted]", user: { password: "[Redacted]" } } });
		expect(logger.getLogs()[0]?.details).toEqual({
			token: "[Redacted]",
			keep: "ok",
			details: { password: "[Redacted]", user: { password: "[Redacted]" } },
		});
	});

	it("adds the current log context to each line, and nothing outside it", () => {
		const { logger, parsed } = setup();

		logContext.run({ reqId: "r1" }, () => logger.info("inside"));
		logger.info("outside");

		const [inside, outside] = parsed();
		expect(inside).toMatchObject({ message: "inside", reqId: "r1" });
		expect(outside).not.toHaveProperty("reqId");
	});

	it("caches the top-level fields as details, including the log context", () => {
		const { logger } = setup();

		logContext.run({ reqId: "r1" }, () => logger.warn({ a: 1 }, "with fields"));
		logContext.run({ reqId: "r2" }, () => logger.warn("without fields"));
		logger.warn("no context, no fields");

		expect(logger.getLogs().map((entry) => entry.details)).toEqual([{ reqId: "r1", a: 1 }, { reqId: "r2" }, undefined]);
	});

	it("keeps pino-http request lines out of the cache, but not lines that merely log a responseTime", () => {
		const { logger, parsed } = setup();
		const pinoLogger = (logger as unknown as { pino: { info: (obj: object, msg: string) => void } }).pino;

		pinoLogger.info({ httpRequest: { id: "r1" }, httpResponse: { statusCode: 200 }, httpDurationMs: 3 }, "GET /api/v1/x 200 3ms");
		logger.info({ responseTime: 42 }, "check completed");

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
			logger.info("handler line");
			res.json({ ok: true });
		});
		app.get("/api/v1/health", (_req, res) => {
			res.json({ ok: true });
		});
		app.get("/static.js", (_req, res) => {
			res.send("// js");
		});
		app.use(
			"/api/v1/heartbeat",
			express.Router().get("/:token", (_req, res) => {
				res.json({ ok: true });
			})
		);
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

	it("redacts a heartbeat token from the request line and message", async () => {
		const { request, requestLines, close } = await setupApp();
		try {
			await request("/api/v1/heartbeat/secret-tok");

			const [line] = requestLines();
			expect(JSON.stringify(line)).not.toContain("secret-tok");
			expect(line?.message).toMatch(/^GET \/api\/v1\/heartbeat\/\[Redacted\] 200/);
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

	it("caches a call's fields as details", () => {
		const { logger } = setup();

		logger.child({ service: "TestService" }).info({ a: 1 }, "new");

		expect(logger.getLogs()[0]).toMatchObject({ message: "new", service: "TestService", details: { a: 1 } });
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

describe("error serialization", () => {
	// A real got failure: the error carries the request options (URL, headers, body) as enumerable properties.
	const failedGotRequest = async () => {
		const server = http.createServer((_req, res) => {
			res.statusCode = 500;
			res.end("nope");
		});
		server.listen(0);
		await new Promise((resolve) => server.once("listening", resolve));
		const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hooks/SECRET-WEBHOOK-TOKEN`;
		try {
			await got.post(url, { json: { routing_key: "SECRET-BODY-KEY" }, headers: { Authorization: "Bearer SECRET-HEADER" }, retry: { limit: 0 } });
			throw new Error("expected the request to fail");
		} catch (error) {
			return error;
		} finally {
			await new Promise((resolve) => server.close(resolve));
		}
	};

	it("drops a got error's request options, keeping message, stack and code", async () => {
		const { logger, lines, parsed } = setup();
		const error = await failedGotRequest();

		logger.warn({ err: error }, "Webhook alert failed");

		expect(lines[0]).not.toContain("SECRET-WEBHOOK-TOKEN");
		expect(lines[0]).not.toContain("SECRET-HEADER");
		expect(lines[0]).not.toContain("SECRET-BODY-KEY");
		const err = parsed()[0]?.err as Record<string, unknown>;
		expect(Object.keys(err).sort()).toEqual(["code", "message", "stack", "type"]);
		expect(err).toMatchObject({ type: "HTTPError", code: "ERR_NON_2XX_3XX_RESPONSE", message: expect.stringContaining("500") });
	});

	it("drops unlisted properties on causes too", () => {
		const { logger, parsed } = setup();
		const cause = Object.assign(new Error("inner"), { options: { url: "https://hooks.example/SECRET" } });
		const error = Object.assign(new Error("outer", { cause }), { options: { url: "https://hooks.example/SECRET" } });

		logger.error({ err: error }, "failed");

		const err = parsed()[0]?.err as Record<string, Record<string, unknown>>;
		expect(err).not.toHaveProperty("options");
		expect(err.cause).toMatchObject({ type: "Error", message: "inner" });
		expect(err.cause).not.toHaveProperty("options");
	});

	it("keeps an AppError's status and details", () => {
		const { logger, parsed } = setup();
		const error = new AppError({ status: 422, description: "Invalid" }, { message: "bad input", details: { field: "name" } });

		logger.warn({ err: error }, "rejected");

		expect(parsed()[0]?.err).toMatchObject({ message: "bad input", status: 422, details: { field: "name" } });
	});

	it("keeps a system error's code, errno and syscall", () => {
		const { logger, parsed } = setup();
		const error = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:1"), { code: "ECONNREFUSED", errno: -111, syscall: "connect" });

		logger.error({ err: error }, "connect failed");

		expect(parsed()[0]?.err).toMatchObject({ code: "ECONNREFUSED", errno: -111, syscall: "connect" });
	});

	it("passes a non-object err through unchanged", () => {
		const { logger, parsed } = setup();

		logger.warn({ err: "plain string" }, "odd");

		expect(parsed()[0]?.err).toBe("plain string");
	});
});

describe("error serialization: URLs in messages", () => {
	it.each([
		["a webhook path", "POST https://hooks.slack.com/services/T0/B0/XXXX failed", "POST https://hooks.slack.com/[Redacted] failed"],
		["a query string", "GET https://api.example.com?token=abc failed", "GET https://api.example.com/[Redacted] failed"],
		["credentials in the URL", "GET https://user:pass@db.example.com/x failed", "GET https://db.example.com/[Redacted] failed"],
		["a bare host", "connect to https://example.com failed", "connect to https://example.com failed"],
		["a host with a port", "POST http://127.0.0.1:8080/hook failed", "POST http://127.0.0.1:8080/[Redacted] failed"],
		["a URL in parentheses", "failed (https://example.com/secret)", "failed (https://example.com/[Redacted])"],
	])("masks %s", (_label, message, expected) => {
		const { logger, parsed } = setup();

		logger.error({ err: new Error(message) }, "failed");

		const err = parsed()[0]?.err as Record<string, string>;
		expect(err.message).toBe(expected);
		expect(err.stack.split("\n")[0]).toBe(`Error: ${expected}`);
	});

	it("masks URLs in a cause's message", () => {
		const { logger, parsed } = setup();
		const error = new Error("outer", { cause: new Error("POST https://hooks.example/SECRET failed") });

		logger.error({ err: error }, "failed");

		expect((parsed()[0]?.err as Record<string, Record<string, string>>).cause.message).toBe("POST https://hooks.example/[Redacted] failed");
	});
});

describe("reserved field names", () => {
	// The types reject these keys at compile time; this covers values the types miss.
	it("renames message, level and timestamp fields instead of writing the keys twice", () => {
		const { logger, lines } = setup();
		const loose: Record<string, unknown> = { message: "status text", level: "high", timestamp: 123, code: 500 };

		logger.warn(loose as never, "No check could be built");

		const line = lines[0] ?? "";
		for (const key of ["message", "level", "timestamp"]) {
			expect(line.split(`"${key}":`)).toHaveLength(2); // the key appears exactly once
		}
		expect(JSON.parse(line)).toMatchObject({
			level: "warn",
			message: "No check could be built",
			field_message: "status text",
			field_level: "high",
			field_timestamp: 123,
			code: 500,
		});
	});

	it("renames a service field to field_service, but not a child's service binding", () => {
		const { logger, lines, parsed } = setup();
		const loose: Record<string, unknown> = { service: "FromFields" };

		logger.child({ service: "ChildService" }).info(loose as never, "service clash");

		expect((lines[0] ?? "").split('"service":')).toHaveLength(2); // the key appears exactly once
		expect(parsed()[0]).toMatchObject({ service: "ChildService", field_service: "FromFields" });
	});

	it("does not rename child bindings or the log context", () => {
		const { logger, parsed } = setup();

		logContext.run({ reqId: "r1" }, () => logger.child({ service: "ChildService" }).info({ a: 1 }, "fine"));

		const entry = parsed()[0];
		expect(entry).toMatchObject({ service: "ChildService", reqId: "r1", a: 1, message: "fine" });
		expect(Object.keys(entry ?? {}).some((key) => key.startsWith("field_"))).toBe(false);
	});

	it("passes fields without reserved keys through unchanged", () => {
		const { logger, parsed } = setup();

		logger.info({ monitorId: "m1", details: { message: "nested is fine" } }, "ok");

		expect(parsed()[0]).toMatchObject({ monitorId: "m1", details: { message: "nested is fine" }, message: "ok" });
	});
});
