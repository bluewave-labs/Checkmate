import { afterEach, describe, expect, it, jest } from "@jest/globals";
import Logger from "../../../src/utils/logger.ts";
import { runWithLogContext } from "../../../src/utils/logContext.ts";
import { AppError } from "../../../src/utils/AppError.ts";

type WriteTarget = { write: (...args: unknown[]) => boolean };

const isWriteTarget = (value: unknown): value is WriteTarget =>
	typeof value === "object" && value !== null && typeof Reflect.get(value, "write") === "function";

const captureOutput = () => {
	const lines: string[] = [];
	const record = (chunk: unknown, ...rest: unknown[]) => {
		lines.push(String(chunk));
		const callback = rest.find((arg) => typeof arg === "function");
		if (typeof callback === "function") callback();
		return true;
	};
	jest.spyOn(process.stdout, "write").mockImplementation(record);
	const consoleStdout: unknown = Reflect.get(console, "_stdout");
	if (consoleStdout !== process.stdout && isWriteTarget(consoleStdout)) jest.spyOn(consoleStdout, "write").mockImplementation(record);
	jest.spyOn(console, "log").mockImplementation(record);
	return lines;
};

afterEach(() => {
	jest.restoreAllMocks();
});

describe("Logger", () => {
	describe("level gating", () => {
		it("neither emits nor caches entries below the active level", async () => {
			const setup = () => {
				const lines = captureOutput();
				const logger = new Logger({ level: "info", json: true });
				return { lines, logger };
			};
			const { lines, logger } = setup();
			logger.debug({ message: "hidden" });
			logger.info({ message: "shown" });
			await logger.flush();
			expect(logger.getLogs().map((entry) => entry.message)).toEqual(["shown"]);
			expect(lines.join("")).not.toContain("hidden");
			expect(lines.join("")).toContain("shown");
		});

		it("applies a new level from configure to both emitting and caching", async () => {
			const setup = () => {
				const lines = captureOutput();
				const logger = new Logger({ level: "info", json: true });
				return { lines, logger };
			};
			const { lines, logger } = setup();
			logger.configure({ level: "debug", json: true });
			logger.debug({ message: "now visible" });
			await new Promise((resolve) => setImmediate(resolve));
			logger.configure({ level: "error", json: true });
			logger.warn({ message: "now hidden" });
			await logger.flush();
			expect(logger.getLogs().map((entry) => entry.message)).toEqual(["now visible"]);
			expect(lines.join("")).toContain("now visible");
			expect(lines.join("")).not.toContain("now hidden");
		});
	});

	describe("cache", () => {
		it("returns a copy from getLogs", () => {
			const setup = () => {
				captureOutput();
				return new Logger({ level: "info", json: true });
			};
			const logger = setup();
			logger.info({ message: "one" });
			logger.getLogs().pop();
			expect(logger.getLogs()).toHaveLength(1);
		});

		it("keeps only the newest 1000 entries", () => {
			const setup = () => {
				captureOutput();
				return new Logger({ level: "info", json: true });
			};
			const logger = setup();
			for (let i = 0; i < 1005; i++) logger.info({ message: `entry ${i}` });
			const logs = logger.getLogs();
			expect(logs).toHaveLength(1000);
			expect(logs[0]?.message).toBe("entry 5");
			expect(logs[999]?.message).toBe("entry 1004");
		});
	});

	describe("entries", () => {
		it("serializes the error, including AppError fields", () => {
			const setup = () => {
				captureOutput();
				return new Logger({ level: "info", json: true });
			};
			const logger = setup();
			const error = new AppError({ status: 404, description: "Not found" }, { message: "missing", service: "MonitorService", details: { id: "1" } });
			logger.error({ message: "Lookup failed", error });
			expect(logger.getLogs()[0]?.error).toEqual(
				expect.objectContaining({ name: "Error", message: "missing", status: 404, service: "MonitorService", details: { id: "1" } })
			);
		});

		it("redacts the message, details and error", () => {
			const setup = () => {
				captureOutput();
				return new Logger({ level: "info", json: true });
			};
			const logger = setup();
			const webhook = "https://hooks.slack.com/services/T000/B000/XXXX";
			logger.warn({ message: `POST ${webhook} failed`, details: { apiKey: "abc" }, error: new Error(`request to ${webhook} failed`) });
			const [entry] = logger.getLogs();
			expect(entry?.message).toBe("POST https://hooks.slack.com/services/[REDACTED] failed");
			expect(entry?.details).toEqual({ apiKey: "[REDACTED]" });
			expect(entry?.error?.message).toBe("request to https://hooks.slack.com/services/[REDACTED] failed");
			expect(entry?.error?.stack).not.toContain("T000");
		});

		it("adds the active log context and omits it outside a scope", () => {
			const setup = () => {
				captureOutput();
				return new Logger({ level: "info", json: true });
			};
			const logger = setup();
			logger.info({ message: "outside" });
			runWithLogContext({ requestId: "req-1" }, () => logger.info({ message: "inside" }));
			const [outside, inside] = logger.getLogs();
			expect(outside).not.toHaveProperty("context");
			expect(inside?.context).toEqual({ requestId: "req-1" });
		});
	});

	describe("output format", () => {
		it("writes one JSON object per line when json is true", async () => {
			const setup = () => {
				const lines = captureOutput();
				const logger = new Logger({ level: "info", json: true });
				return { lines, logger };
			};
			const { lines, logger } = setup();
			logger.error({ message: "boom", service: "Test", error: new Error("inner") });
			await logger.flush();
			const output = lines.join("").trim();
			expect(output.split("\n")).toHaveLength(1);
			expect(JSON.parse(output)).toEqual(expect.objectContaining({ level: "error", message: "boom", service: "Test" }));
		});

		it("writes a readable line followed by the error stack when json is false", async () => {
			const setup = () => {
				const lines = captureOutput();
				const logger = new Logger({ level: "info", json: false });
				return { lines, logger };
			};
			const { lines, logger } = setup();
			logger.error({ message: "boom", service: "Test", method: "run", error: new Error("inner", { cause: new Error("root") }) });
			await logger.flush();
			const output = lines.join("");
			expect(output).toContain("[Test](run) boom");
			expect(output).toContain("Error: inner");
			expect(output).toContain("Caused by: Error: root");
		});
	});

	describe("flush", () => {
		it("resolves once the logger has finished writing", async () => {
			const setup = () => {
				captureOutput();
				return new Logger({ level: "info", json: true });
			};
			const logger = setup();
			logger.info({ message: "last line" });
			await expect(logger.flush()).resolves.toBeUndefined();
		});

		it("returns the same promise when called again", async () => {
			const setup = () => {
				captureOutput();
				return new Logger({ level: "info", json: true });
			};
			const logger = setup();
			const first = logger.flush();
			expect(logger.flush()).toBe(first);
			await first;
		});

		it("writes lines logged after flush straight to stdout instead of the closed stream", async () => {
			const setup = () => {
				const lines = captureOutput();
				const logger = new Logger({ level: "info", json: false });
				const uncaught = jest.fn();
				process.on("uncaughtException", uncaught);
				return { lines, logger, uncaught };
			};
			const { lines, logger, uncaught } = setup();
			await logger.flush();
			lines.length = 0;

			logger.error({ message: "late failure", service: "Shutdown", error: new Error("boom") });
			await new Promise((resolve) => setImmediate(resolve));
			process.off("uncaughtException", uncaught);

			expect(uncaught).not.toHaveBeenCalled();
			expect(lines).toHaveLength(1);
			expect(JSON.parse(lines[0] ?? "")).toEqual(expect.objectContaining({ level: "error", message: "late failure", service: "Shutdown" }));
			expect(logger.getLogs().at(-1)?.message).toBe("late failure");
		});
	});
});
