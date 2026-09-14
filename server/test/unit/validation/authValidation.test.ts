import { describe, expect, it } from "@jest/globals";
import { registerInviteTokenValidation } from "../../../src/api/validation/authValidation.ts";

describe("authValidation", () => {
	describe("registerInviteTokenValidation", () => {
		it("accepts a valid token string", () => {
			expect(registerInviteTokenValidation.parse("a".repeat(64))).toBe("a".repeat(64));
		});

		it("defaults an absent token to an empty string", () => {
			expect(registerInviteTokenValidation.parse(undefined)).toBe("");
		});

		it("rejects a NoSQL operator object in place of a token", () => {
			expect(() => registerInviteTokenValidation.parse({ $ne: null })).toThrow();
		});

		it("rejects an array token", () => {
			expect(() => registerInviteTokenValidation.parse(["a", "b"])).toThrow();
		});
	});
});
