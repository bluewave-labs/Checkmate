import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { validateEnv } from "../../../src/config/envValidation.ts";
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
