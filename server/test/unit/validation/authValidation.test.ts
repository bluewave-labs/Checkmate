import { describe, expect, it } from "@jest/globals";
import {
	registerInviteTokenValidation,
	inviteBodyValidation,
	inviteIdParamValidation,
	updateInviteExpiryBodyValidation,
} from "../../../src/api/validation/authValidation.ts";
import { MIN_INVITE_EXPIRY_HOURS, MAX_INVITE_EXPIRY_HOURS } from "../../../src/domain/invites/invite.constants.ts";

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

	describe("inviteBodyValidation expiresInHours", () => {
		const validInvite = { email: "new@example.com", role: ["user"], teamId: "team-1" };

		it("accepts an invite with no expiresInHours (falls back to the server default)", () => {
			expect(() => inviteBodyValidation.parse(validInvite)).not.toThrow();
		});

		it("accepts the MIN and MAX boundary values", () => {
			expect(() => inviteBodyValidation.parse({ ...validInvite, expiresInHours: MIN_INVITE_EXPIRY_HOURS })).not.toThrow();
			expect(() => inviteBodyValidation.parse({ ...validInvite, expiresInHours: MAX_INVITE_EXPIRY_HOURS })).not.toThrow();
		});

		it("rejects a duration below MIN", () => {
			expect(() => inviteBodyValidation.parse({ ...validInvite, expiresInHours: MIN_INVITE_EXPIRY_HOURS - 1 })).toThrow();
		});

		it("rejects a duration above MAX", () => {
			expect(() => inviteBodyValidation.parse({ ...validInvite, expiresInHours: MAX_INVITE_EXPIRY_HOURS + 1 })).toThrow();
		});

		it("rejects a fractional number of hours", () => {
			expect(() => inviteBodyValidation.parse({ ...validInvite, expiresInHours: 1.5 })).toThrow();
		});

		it("rejects a numeric string in place of a number", () => {
			expect(() => inviteBodyValidation.parse({ ...validInvite, expiresInHours: "24" })).toThrow();
		});

		it("rejects a NoSQL operator object in place of a duration", () => {
			expect(() => inviteBodyValidation.parse({ ...validInvite, expiresInHours: { $gt: 0 } })).toThrow();
		});
	});

	describe("updateInviteExpiryBodyValidation", () => {
		it("accepts the MIN and MAX boundary values", () => {
			expect(updateInviteExpiryBodyValidation.parse({ expiresInHours: MIN_INVITE_EXPIRY_HOURS })).toEqual({
				expiresInHours: MIN_INVITE_EXPIRY_HOURS,
			});
			expect(updateInviteExpiryBodyValidation.parse({ expiresInHours: MAX_INVITE_EXPIRY_HOURS })).toEqual({
				expiresInHours: MAX_INVITE_EXPIRY_HOURS,
			});
		});

		it("requires expiresInHours (unlike the create path, there is no default to fall back to)", () => {
			expect(() => updateInviteExpiryBodyValidation.parse({})).toThrow();
		});

		it("rejects durations outside the bounds", () => {
			expect(() => updateInviteExpiryBodyValidation.parse({ expiresInHours: MIN_INVITE_EXPIRY_HOURS - 1 })).toThrow();
			expect(() => updateInviteExpiryBodyValidation.parse({ expiresInHours: MAX_INVITE_EXPIRY_HOURS + 1 })).toThrow();
		});

		it("rejects a fractional number of hours", () => {
			expect(() => updateInviteExpiryBodyValidation.parse({ expiresInHours: 0.5 })).toThrow();
		});
	});

	describe("inviteIdParamValidation", () => {
		it("accepts a non-empty id", () => {
			expect(inviteIdParamValidation.parse({ id: "inv-1" })).toEqual({ id: "inv-1" });
		});

		it("rejects an empty id", () => {
			expect(() => inviteIdParamValidation.parse({ id: "" })).toThrow();
		});

		it("rejects a NoSQL operator object in place of an id", () => {
			expect(() => inviteIdParamValidation.parse({ id: { $ne: null } })).toThrow();
		});
	});
});
