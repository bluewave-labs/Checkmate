import { describe, expect, it } from "@jest/globals";
import { serializeError } from "../../../src/utils/serializedError.ts";
import { AppError } from "../../../src/utils/AppError.ts";

describe("serializeError", () => {
	it("captures name, message and stack of a plain Error", () => {
		const error = new TypeError("bad input");
		expect(serializeError(error)).toEqual({ name: "TypeError", message: "bad input", stack: error.stack });
	});

	it("captures AppError status, service, method and details", () => {
		const error = new AppError(
			{ status: 409, description: "Conflict" },
			{ message: "duplicate", service: "MonitorService", method: "create", details: { monitorId: "m1" } }
		);
		expect(serializeError(error)).toEqual(
			expect.objectContaining({ message: "duplicate", status: 409, service: "MonitorService", method: "create", details: { monitorId: "m1" } })
		);
	});

	it("follows the cause chain", () => {
		const error = new Error("outer", { cause: new Error("inner") });
		expect(serializeError(error).cause).toEqual(expect.objectContaining({ message: "inner" }));
	});

	it("stops the cause chain after three levels", () => {
		const level4 = new Error("4");
		const level3 = new Error("3", { cause: level4 });
		const level2 = new Error("2", { cause: level3 });
		const level1 = new Error("1", { cause: level2 });
		const top = new Error("0", { cause: level1 });
		const result = serializeError(top);
		expect(result.cause?.cause?.cause?.message).toBe("3");
		expect(result.cause?.cause?.cause?.cause).toBeUndefined();
	});

	it.each([
		["a string", "plain text", "plain text"],
		["a number", 42, "42"],
		["undefined", undefined, "undefined"],
		["an object", { code: 1 }, "[object Object]"],
	])("wraps %s as a NonError", (_name, value, message) => {
		expect(serializeError(value)).toEqual({ name: "NonError", message });
	});
});

describe("AppError cause", () => {
	it("is serialized as the cause chain, so a wrapped error's own message survives", () => {
		const original = Object.assign(new Error("Invalid login: 535 5.7.8 Authentication failed"), { code: "EAUTH" });
		const wrapped = new AppError(
			{ status: 502, description: "The mail server rejected the message" },
			{ message: "Failed to send email", cause: original }
		);
		expect(serializeError(wrapped)).toEqual(
			expect.objectContaining({
				message: "Failed to send email",
				status: 502,
				cause: expect.objectContaining({ message: "Invalid login: 535 5.7.8 Authentication failed" }),
			})
		);
	});

	it("has no cause when none is given", () => {
		expect(new AppError({ status: 404, description: "Not found" }).cause).toBeUndefined();
	});
});

describe("system error fields", () => {
	it("captures code, errno, syscall, address and port", () => {
		const error = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:27017"), {
			code: "ECONNREFUSED",
			errno: -111,
			syscall: "connect",
			address: "127.0.0.1",
			port: 27017,
		});
		expect(serializeError(error)).toEqual(
			expect.objectContaining({ code: "ECONNREFUSED", errno: -111, syscall: "connect", address: "127.0.0.1", port: 27017 })
		);
	});

	it("keeps a numeric code", () => {
		expect(serializeError(Object.assign(new Error("duplicate key"), { code: 11000 })).code).toBe(11000);
	});

	it("ignores fields of the wrong type", () => {
		const result = serializeError(Object.assign(new Error("odd"), { code: { nested: true }, port: "80" }));
		expect(result).not.toHaveProperty("code");
		expect(result).not.toHaveProperty("port");
	});

	it("serializes the inner errors of an AggregateError, so an empty message still says what failed", () => {
		const v4 = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:25"), { code: "ECONNREFUSED", address: "127.0.0.1", port: 25 });
		const v6 = Object.assign(new Error("connect ECONNREFUSED ::1:25"), { code: "ECONNREFUSED", address: "::1", port: 25 });
		const result = serializeError(new AggregateError([v4, v6], ""));
		expect(result.message).toBe("");
		expect(result.errors).toEqual([
			expect.objectContaining({ code: "ECONNREFUSED", address: "127.0.0.1", port: 25 }),
			expect.objectContaining({ code: "ECONNREFUSED", address: "::1", port: 25 }),
		]);
	});

	it("keeps at most five inner errors", () => {
		const inner = Array.from({ length: 8 }, (_, i) => new Error(`attempt ${i}`));
		expect(serializeError(new AggregateError(inner, "all failed")).errors).toHaveLength(5);
	});
});
