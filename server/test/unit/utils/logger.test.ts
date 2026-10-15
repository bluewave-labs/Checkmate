import { afterEach, describe, expect, it, jest } from "@jest/globals";
import Logger from "../../../src/utils/logger.ts";

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
});
