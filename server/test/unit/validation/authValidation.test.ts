import { describe, expect, it } from "@jest/globals";
import { inviteBodyValidation, registerInviteTokenValidation } from "../../../src/api/validation/authValidation.ts";

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

	describe("inviteBodyValidation", () => {
		// User emails are stored lowercased, so an invite has to be too or it can never be matched by email.
		it("lowercases the email", () => {
			const result = inviteBodyValidation.safeParse({ email: "Ada@Example.com", role: ["user"], teamId: "team-1" });
			expect(result.success).toBe(true);
			expect(result.data?.email).toBe("ada@example.com");
		});
	});
});
