import { describe, expect, it } from "@jest/globals";
import { timeRequest, NETWORK_ERROR, PING_ERROR, isStatusUp } from "../../../../src/service/network/utils.ts";

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

	describe("isStatusUp", () => {
		it("returns true for 2xx status codes", () => {
			expect(isStatusUp(200)).toBe(true);
			expect(isStatusUp(201)).toBe(true);
			expect(isStatusUp(204)).toBe(true);
			expect(isStatusUp(299)).toBe(true);
		});

		it("returns false for non-2xx status codes without customUpCodes", () => {
			expect(isStatusUp(100)).toBe(false);
			expect(isStatusUp(301)).toBe(false);
			expect(isStatusUp(404)).toBe(false);
			expect(isStatusUp(500)).toBe(false);
		});

		it("returns true when status code is in customUpCodes", () => {
			expect(isStatusUp(301, [301])).toBe(true);
			expect(isStatusUp(404, [200, 404])).toBe(true);
			expect(isStatusUp(401, [401, 403])).toBe(true);
		});

		it("returns false when status code is not in customUpCodes", () => {
			expect(isStatusUp(500, [401, 403])).toBe(false);
		});

		it("returns false when statusCode is undefined", () => {
			expect(isStatusUp(undefined)).toBe(false);
			expect(isStatusUp(undefined, [200])).toBe(false);
		});

		it("defaults customUpCodes to empty array", () => {
			expect(isStatusUp(200)).toBe(true);
			expect(isStatusUp(404)).toBe(false);
		});
	});
});
