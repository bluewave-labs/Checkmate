import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression tests for the credential leak reported in #3843: a failed request
 * wrote the full body — including the plaintext password — to the console.
 *
 * These drive the exported `logger` rather than the private redaction helpers,
 * so they cover the wiring too. The original fix redacted the JSON branch but
 * left the debug branch printing the raw objects, which these tests catch.
 *
 * `configuredLevel` is captured at module load, so each level needs a fresh
 * import with `runtimeConfig` mocked beforehand.
 */

const PASSWORD = "correct-horse-battery-staple";
const BEARER = "eyJhbGciOiJIUzI1NiJ9.super-secret-jwt";

type ConsoleMethod = "log" | "warn" | "error";
const spies: Partial<Record<ConsoleMethod, ReturnType<typeof vi.spyOn>>> = {};

/** Everything written to the console during a test, as one searchable string. */
const consoleOutput = (): string =>
	(["log", "warn", "error"] as const)
		.flatMap((method) => spies[method]?.mock.calls ?? [])
		.map((args) => args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(" "))
		.join("\n");

const loadLogger = async (level: "debug" | "error") => {
	vi.resetModules();
	vi.doMock("@/Utils/runtimeConfig", () => ({ runtimeConfig: { logLevel: level } }));
	return (await import("@/Utils/logger")).logger;
};

beforeEach(() => {
	for (const method of ["log", "warn", "error"] as const) {
		spies[method] = vi.spyOn(console, method).mockImplementation(() => {});
	}
	vi.spyOn(console, "group").mockImplementation(() => {});
	vi.spyOn(console, "groupEnd").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.doUnmock("@/Utils/runtimeConfig");
});

describe.each(["error", "debug"] as const)("logger at level %s", (level) => {
	it("does not log a password from a failed request body", async () => {
		const logger = await loadLogger(level);

		logger.error("POST request failed", new Error("Request failed"), {
			endpoint: "/auth/login",
			body: { email: "user@example.com", password: PASSWORD },
		});

		expect(consoleOutput()).not.toContain(PASSWORD);
		expect(consoleOutput()).toContain("[REDACTED]");
	});

	it("keeps non-sensitive context so logs stay useful", async () => {
		const logger = await loadLogger(level);

		logger.error("POST request failed", new Error("boom"), {
			endpoint: "/auth/login",
			body: { email: "user@example.com", password: PASSWORD },
		});

		const output = consoleOutput();
		expect(output).toContain("/auth/login");
		expect(output).toContain("user@example.com");
	});

	it("does not leak credentials carried on an AxiosError", async () => {
		const logger = await loadLogger(level);

		// Axios attaches the outgoing request to the error: `config.data` holds the
		// serialized body and `config.headers` the Authorization set in ApiClient.
		const axiosError = Object.assign(new Error("Request failed with status code 502"), {
			name: "AxiosError",
			config: {
				url: "/auth/login",
				method: "post",
				data: JSON.stringify({ email: "user@example.com", password: PASSWORD }),
				headers: { Authorization: `Bearer ${BEARER}`, Accept: "application/json" },
			},
			response: { status: 502 },
		});

		logger.error("POST request failed", axiosError, { endpoint: "/auth/login" });

		const output = consoleOutput();
		expect(output).not.toContain(PASSWORD);
		expect(output).not.toContain(BEARER);
	});

	it("redacts a password held on a class instance, not just an object literal", async () => {
		const logger = await loadLogger(level);

		// Declared without parameter properties: the repo enables
		// `erasableSyntaxOnly`, which disallows that shorthand.
		class LoginPayload {
			email: string;
			password: string;

			constructor(email: string, password: string) {
				this.email = email;
				this.password = password;
			}
		}

		logger.error("POST request failed", new Error("boom"), {
			endpoint: "/auth/login",
			body: new LoginPayload("user@example.com", PASSWORD),
		});

		expect(consoleOutput()).not.toContain(PASSWORD);
	});

	it("redacts a request body that is not JSON rather than logging it raw", async () => {
		const logger = await loadLogger(level);

		const formEncoded = Object.assign(new Error("boom"), {
			config: {
				url: "/auth/login",
				method: "post",
				data: `email=user@example.com&password=${PASSWORD}`,
				headers: {},
			},
		});

		logger.error("POST request failed", formEncoded, {});

		expect(consoleOutput()).not.toContain(PASSWORD);
	});

	it("redacts secrets passed through warn", async () => {
		const logger = await loadLogger(level);

		logger.warn("monitor update failed", {
			endpoint: "/monitors/1",
			body: { url: "https://example.com", secret: BEARER },
		});

		expect(consoleOutput()).not.toContain(BEARER);
	});
});

describe("logger at level debug", () => {
	// debug() and info() are suppressed at error level, so they only apply here.
	it("redacts secrets passed through debug and info", async () => {
		const logger = await loadLogger("debug");

		logger.debug("payload", { password: PASSWORD });
		logger.info("payload", { apiKey: BEARER });

		const output = consoleOutput();
		expect(output).not.toContain(PASSWORD);
		expect(output).not.toContain(BEARER);
	});
});

describe("redaction key matching", () => {
	it.each([
		["password", { password: PASSWORD }],
		["newPassword", { newPassword: PASSWORD }],
		["confirmPassword", { confirmPassword: PASSWORD }],
		["secret", { secret: PASSWORD }],
		["accessToken", { accessToken: PASSWORD }],
		["X-Api-Key", { "X-Api-Key": PASSWORD }],
		["Authorization", { Authorization: PASSWORD }],
		["private_key", { private_key: PASSWORD }],
	])("redacts %s", async (_name, body) => {
		const logger = await loadLogger("error");

		logger.error("POST request failed", undefined, { body });

		expect(consoleOutput()).not.toContain(PASSWORD);
	});

	it("survives a circular payload without hanging", async () => {
		const logger = await loadLogger("error");

		const circular: Record<string, unknown> = { password: PASSWORD };
		circular.self = circular;

		expect(() =>
			logger.error("POST request failed", undefined, { body: circular })
		).not.toThrow();
		expect(consoleOutput()).not.toContain(PASSWORD);
	});

	it("renders a repeated sibling in full rather than marking it circular", async () => {
		const logger = await loadLogger("error");

		const shared = { monitorId: "abc123" };

		logger.error("POST request failed", undefined, { first: shared, second: shared });

		expect(consoleOutput()).not.toContain("[CIRCULAR]");
	});
});
