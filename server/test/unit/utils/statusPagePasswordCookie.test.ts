import { describe, expect, it } from "@jest/globals";
import {
	buildCookieName,
	signUnlockToken,
	verifyUnlockToken,
	UNLOCK_TOKEN_TTL_SECONDS,
	UNLOCK_COOKIE_PATH,
} from "../../../src/utils/statusPagePasswordCookie.ts";

const SECRET = "test-secret";

describe("statusPagePasswordCookie", () => {
	it("buildCookieName returns checkmate_sp_<id>", () => {
		expect(buildCookieName("abc123")).toBe("checkmate_sp_abc123");
	});

	it("signUnlockToken / verifyUnlockToken roundtrip", () => {
		const token = signUnlockToken({ statusPageId: "page-1", passwordVersion: 7 }, SECRET);
		const claims = verifyUnlockToken(token, SECRET);
		expect(claims).not.toBeNull();
		expect(claims!.statusPageId).toBe("page-1");
		expect(claims!.pv).toBe(7);
		expect(claims!.kind).toBe("statuspage");
	});

	it("verifyUnlockToken returns null for a bad signature", () => {
		const token = signUnlockToken({ statusPageId: "page-1", passwordVersion: 7 }, SECRET);
		expect(verifyUnlockToken(token, "wrong-secret")).toBeNull();
	});

	it("verifyUnlockToken returns null for an admin JWT (missing kind)", async () => {
		const jwt = (await import("jsonwebtoken")).default;
		const token = jwt.sign({ id: "u", role: ["user"] }, SECRET, { expiresIn: "1h" });
		expect(verifyUnlockToken(token, SECRET)).toBeNull();
	});

	it("UNLOCK_TOKEN_TTL_SECONDS is 7 days", () => {
		expect(UNLOCK_TOKEN_TTL_SECONDS).toBe(7 * 24 * 60 * 60);
	});

	it("UNLOCK_COOKIE_PATH scopes cookies to status-page routes", () => {
		expect(UNLOCK_COOKIE_PATH).toBe("/api/v1/status-page");
	});
});
