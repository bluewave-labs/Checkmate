import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { once } from "node:events";
import express from "express";
import { trustProxySetting, validateEnv } from "../../../src/config/envValidation.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const ORIGINAL_ENV = process.env;

const REQUIRED = {
	NODE_ENV: "production",
	DB_CONNECTION_STRING: "mongodb://localhost:27017/uptime_db",
	JWT_SECRET: "secret",
	CLIENT_HOST: "http://localhost:52345",
};

class ExitCalled extends Error {}

const setup = (env: Record<string, string | undefined>) => {
	process.env = { ...env };
	const logger = createMockLogger();
	const exit = jest.spyOn(process, "exit").mockImplementation(() => {
		throw new ExitCalled();
	});
	return { logger, exit };
};

afterEach(() => {
	process.env = ORIGINAL_ENV;
	jest.restoreAllMocks();
});

describe("validateEnv", () => {
	it("defaults NODE_ENV to production and warns when it is missing", () => {
		const { logger, exit } = setup({ ...REQUIRED, NODE_ENV: undefined });
		expect(validateEnv(logger).NODE_ENV).toBe("production");
		expect(exit).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("NODE_ENV is not set") }));
	});

	it("does not warn when NODE_ENV is set", () => {
		const { logger } = setup(REQUIRED);
		validateEnv(logger);
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it("fails when NODE_ENV has an unknown value", () => {
		const { logger, exit } = setup({ ...REQUIRED, NODE_ENV: "staging" });
		expect(() => validateEnv(logger)).toThrow(ExitCalled);
		expect(exit).toHaveBeenCalledWith(1);
	});

	it.each(["development", "production", "test"])("accepts NODE_ENV=%s", (nodeEnv) => {
		const { logger, exit } = setup({ ...REQUIRED, NODE_ENV: nodeEnv });
		expect(validateEnv(logger).NODE_ENV).toBe(nodeEnv);
		expect(exit).not.toHaveBeenCalled();
	});

	it("defaults LOG_LEVEL to info", () => {
		const { logger } = setup(REQUIRED);
		expect(validateEnv(logger).LOG_LEVEL).toBe("info");
	});

	it("uses an explicit LOG_LEVEL", () => {
		const { logger } = setup({ ...REQUIRED, LOG_LEVEL: "debug" });
		expect(validateEnv(logger).LOG_LEVEL).toBe("debug");
	});

	it("fails when LOG_LEVEL has an unknown value", () => {
		const { logger, exit } = setup({ ...REQUIRED, LOG_LEVEL: "verbose" });
		expect(() => validateEnv(logger)).toThrow(ExitCalled);
		expect(exit).toHaveBeenCalledWith(1);
	});
});

describe("TRUST_PROXY", () => {
	it("is off when unset or blank", () => {
		expect(trustProxySetting.parse(undefined)).toBeUndefined();
		expect(trustProxySetting.parse("  ")).toBeUndefined();
	});

	it("parses a hop count as a number", () => {
		expect(trustProxySetting.parse("1")).toBe(1);
		expect(trustProxySetting.parse(" 2 ")).toBe(2);
	});

	it("parses a list of IPs, CIDRs and keywords", () => {
		expect(trustProxySetting.parse("loopback, 10.0.0.0/8,  192.168.1.5, ::1, fd00::/8")).toEqual([
			"loopback",
			"10.0.0.0/8",
			"192.168.1.5",
			"::1",
			"fd00::/8",
		]);
	});

	it.each([
		["true, which would trust any client's X-Forwarded-For", "true"],
		["a hostname", "nginx"],
		["a malformed CIDR", "10.0.0.0/8/1"],
		["a non-numeric prefix", "10.0.0.0/abc"],
	])("rejects %s", (_name, value) => {
		const result = trustProxySetting.safeParse(value);
		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toContain("TRUST_PROXY must be");
	});

	it("fails env validation with a clear message", () => {
		const { logger, exit } = setup({ ...REQUIRED, TRUST_PROXY: "true" });
		expect(() => validateEnv(logger)).toThrow(ExitCalled);
		expect(exit).toHaveBeenCalledWith(1);
		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("TRUST_PROXY") }));
	});

	describe("applied to Express", () => {
		const ipSeenBy = async (trustProxy: ReturnType<typeof trustProxySetting.parse>) => {
			const app = express();
			if (trustProxy !== undefined) app.set("trust proxy", trustProxy);
			app.get("/", (req, res) => {
				res.send(req.ip);
			});
			const server = app.listen(0);
			await once(server, "listening");
			try {
				const address = server.address();
				if (address === null || typeof address === "string") throw new Error("Test server has no port");
				const response = await fetch(`http://127.0.0.1:${address.port}/`, { headers: { "X-Forwarded-For": "203.0.113.7" } });
				return await response.text();
			} finally {
				server.close();
			}
		};

		it("ignores X-Forwarded-For when unset", async () => {
			expect(await ipSeenBy(trustProxySetting.parse(undefined))).not.toBe("203.0.113.7");
		});

		it.each(["1", "loopback", "127.0.0.1/8, ::1"])("uses X-Forwarded-For with TRUST_PROXY=%s", async (value) => {
			expect(await ipSeenBy(trustProxySetting.parse(value))).toBe("203.0.113.7");
		});

		it("ignores X-Forwarded-For when the proxy address isn't in the list", async () => {
			expect(await ipSeenBy(trustProxySetting.parse("10.0.0.0/8"))).not.toBe("203.0.113.7");
		});
	});
});
