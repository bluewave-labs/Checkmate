import { describe, expect, it } from "@jest/globals";
import { timeRequest, isStatusUp, peerAnsweredFromError } from "../../../../src/service/network/utils.ts";
import { NETWORK_ERROR } from "../../../../src/types/network.ts";

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
	});

	// The egress check blames the instance only when nothing answered, so this helper's `true` must never be a
	// guess: every code in it requires the peer's own stack to have replied.
	describe("peerAnsweredFromError", () => {
		it.each([
			["ECONNREFUSED", "the host refused the connection"],
			["ECONNRESET", "the host reset an established connection"],
			["EPIPE", "the host closed a connection we were writing to"],
			["EPROTO", "a protocol error on a connection that was made"],
			["CERT_HAS_EXPIRED", "the host presented a certificate"],
			["DEPTH_ZERO_SELF_SIGNED_CERT", "the host presented a certificate"],
			["SELF_SIGNED_CERT_IN_CHAIN", "the host presented a certificate"],
			["UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "the host presented a certificate"],
			["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "the host presented a certificate"],
			["ERR_TLS_CERT_ALTNAME_INVALID", "the host presented a certificate"],
			["CERT_NOT_YET_VALID", "the host presented a certificate"],
			["ERR_SSL_WRONG_VERSION_NUMBER", "the host spoke back, badly"],
		])("reports the peer as having answered for %s", (code) => {
			expect(peerAnsweredFromError(Object.assign(new Error("failed"), { code }))).toBe(true);
		});

		it.each([["ETIMEDOUT"], ["ENOTFOUND"], ["EAI_AGAIN"], ["EHOSTUNREACH"], ["ENETUNREACH"], ["ECONNABORTED"], ["ENETDOWN"]])(
			"reports the peer as silent for %s",
			(code) => {
				expect(peerAnsweredFromError(Object.assign(new Error("failed"), { code }))).toBe(false);
			}
		);

		it("reports the peer as silent when the error carries no code", () => {
			expect(peerAnsweredFromError(new Error("Connection timeout"))).toBe(false);
			expect(peerAnsweredFromError(undefined)).toBe(false);
			expect(peerAnsweredFromError("not an error")).toBe(false);
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
