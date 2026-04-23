import { describe, expect, it } from "@jest/globals";
import { timeRequest, NETWORK_ERROR, PING_ERROR } from "../../../../src/service/infrastructure/network/utils.ts";

describe("network utils", () => {
	describe("timeRequest", () => {
		it("returns response and responseTime on success", async () => {
			const result = await timeRequest(async () => "hello");

			expect(result.response).toBe("hello");
			expect(result.responseTime).toBeGreaterThanOrEqual(0);
			expect(result.error).toBeNull();
		});

		it("returns error and responseTime on failure", async () => {
			const err = new Error("boom");
			const result = await timeRequest(async () => {
				throw err;
			});

			expect(result.response).toBeNull();
			expect(result.responseTime).toBeGreaterThanOrEqual(0);
			expect(result.error).toBe(err);
		});

		it("measures elapsed time", async () => {
			const result = await timeRequest(async () => {
				await new Promise((r) => setTimeout(r, 50));
				return "done";
			});

			expect(result.responseTime).toBeGreaterThanOrEqual(40);
		});
	});

	describe("constants", () => {
		it("NETWORK_ERROR is 5000", () => {
			expect(NETWORK_ERROR).toBe(5000);
		});

		it("PING_ERROR is 5001", () => {
			expect(PING_ERROR).toBe(5001);
		});
	});
});
