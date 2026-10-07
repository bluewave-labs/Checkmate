import { describe, expect, it } from "@jest/globals";
import { randomBytes } from "node:crypto";
import { encryptionKeyList, oidcEnvSchema } from "../../../src/config/envValidation.ts";

const key = () => randomBytes(32).toString("base64");
const decoded = (k: string) => Buffer.from(k, "base64");

const issueMessages = (input: string) => {
	const result = encryptionKeyList.safeParse(input);
	expect(result.success).toBe(false);
	return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("encryptionKeyList", () => {
	it("is an empty list when unset or blank", () => {
		expect(encryptionKeyList.parse(undefined)).toEqual([]);
		expect(encryptionKeyList.parse("")).toEqual([]);
		expect(encryptionKeyList.parse(" , ")).toEqual([]);
	});

	it("accepts one key, trimming whitespace and a trailing comma", () => {
		const k = key();
		expect(encryptionKeyList.parse(k)).toEqual([decoded(k)]);
		expect(encryptionKeyList.parse(`  ${k} ,`)).toEqual([decoded(k)]);
	});

	it("accepts several keys in the given order", () => {
		const a = key();
		const b = key();
		expect(encryptionKeyList.parse(`${a},${b}`)).toEqual([decoded(a), decoded(b)]);
	});

	it.each([
		["43 characters", key().slice(0, 43)],
		["no trailing =", key().slice(0, 43) + "A"],
		["a space inside", key().replace(/^(.{10})/, "$1 ")],
		["base64url alphabet", key().replace(/[+/]/g, "-").replace(/=$/, "")],
		["31 bytes", randomBytes(31).toString("base64")],
		["33 bytes", randomBytes(33).toString("base64")],
	])("rejects an entry that is not 32 standard-base64 bytes (%s)", (_label, bad) => {
		expect(issueMessages(`${key()},${bad}`)).toContain("ENCRYPTION_KEY entry 2 must be 32 bytes as padded standard base64 (openssl rand -base64 32)");
	});

	it("reports every bad entry, not just the first", () => {
		const messages = issueMessages(`${key().slice(0, 43)},${key()},${randomBytes(31).toString("base64")}`);
		expect(messages).toContain("ENCRYPTION_KEY entry 1 must be 32 bytes as padded standard base64 (openssl rand -base64 32)");
		expect(messages).toContain("ENCRYPTION_KEY entry 3 must be 32 bytes as padded standard base64 (openssl rand -base64 32)");
		expect(messages).toHaveLength(2);
	});

	it("numbers entries by comma position, counting blank slots", () => {
		const bad = randomBytes(31).toString("base64");
		expect(issueMessages(`${key()},,${bad}`)).toContain(
			"ENCRYPTION_KEY entry 3 must be 32 bytes as padded standard base64 (openssl rand -base64 32)"
		);
	});

	it("rejects the same key listed twice", () => {
		const k = key();
		expect(issueMessages(`${k},${k}`)).toContain("ENCRYPTION_KEY entry 2 duplicates an earlier entry");
	});

	it("never echoes the entry in an issue message", () => {
		const bad = randomBytes(31).toString("base64");
		for (const message of issueMessages(bad)) {
			expect(message).not.toContain(bad);
		}
	});
});

describe("oidcEnvSchema", () => {
	const enabled = {
		OIDC_ENABLED: "true",
		OIDC_ISSUER: "https://auth.example.com/application/o/checkmate/",
		OIDC_CLIENT_ID: "checkmate",
		OIDC_CLIENT_SECRET: "secret",
		OIDC_REDIRECT_URI: "https://checkmate.example.com/api/v1/auth/sso/callback",
	};

	const messages = (input: Record<string, string>) => {
		const result = oidcEnvSchema.safeParse(input);
		expect(result.success).toBe(false);
		return result.success ? [] : result.error.issues.map((issue) => issue.message);
	};

	const paths = (input: Record<string, string>) => {
		const result = oidcEnvSchema.safeParse(input);
		return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
	};

	it("is off with safe defaults when nothing is set", () => {
		const parsed = oidcEnvSchema.parse({});
		expect(parsed.OIDC_ENABLED).toBe(false);
		expect(parsed.OIDC_ALLOW_LOCAL_LOGIN).toBe(true);
		expect(parsed.OIDC_REQUIRE_VERIFIED_EMAIL).toBe(true);
		expect(parsed.OIDC_AUTO_PROVISION).toBe(false);
		expect(parsed.OIDC_DEFAULT_ROLE).toBe("user");
		expect(parsed.OIDC_SCOPES).toBe("openid profile email");
	});

	it("accepts a complete enabled configuration", () => {
		expect(oidcEnvSchema.safeParse(enabled).success).toBe(true);
	});

	it("requires the client id, secret, issuer and redirect uri once enabled", () => {
		expect(paths({ OIDC_ENABLED: "true" }).sort()).toEqual(["OIDC_CLIENT_ID", "OIDC_CLIENT_SECRET", "OIDC_ISSUER", "OIDC_REDIRECT_URI"]);
	});

	// validateEnv logs error.format() per named key and skips the root _errors bucket,
	// so a cross-field issue without a path would fail the boot without saying why.
	it("attaches every issue to a named field", () => {
		expect(paths({ OIDC_ENABLED: "true" }).every((path) => path.length > 0)).toBe(true);
	});

	it("refuses to disable local login while sso is off, which would lock everyone out", () => {
		expect(messages({ OIDC_ALLOW_LOCAL_LOGIN: "false" })).toEqual([
			"OIDC_ALLOW_LOCAL_LOGIN cannot be false while OIDC_ENABLED is false; nobody could sign in",
		]);
		expect(oidcEnvSchema.safeParse({ ...enabled, OIDC_ALLOW_LOCAL_LOGIN: "false" }).success).toBe(true);
	});

	it("rejects an http issuer unless explicitly allowed", () => {
		const insecure = { ...enabled, OIDC_ISSUER: "http://auth.lan/application/o/checkmate/" };
		expect(paths(insecure)).toEqual(["OIDC_ISSUER"]);
		expect(oidcEnvSchema.safeParse({ ...insecure, OIDC_ALLOW_INSECURE_ISSUER: "true" }).success).toBe(true);
	});

	it("rejects a malformed issuer, embedded credentials, and a query string", () => {
		expect(paths({ ...enabled, OIDC_ISSUER: "not-a-url" })).toEqual(["OIDC_ISSUER"]);
		expect(messages({ ...enabled, OIDC_ISSUER: "https://user:pass@auth.example.com/" })).toContain("OIDC_ISSUER must not embed credentials");
		expect(messages({ ...enabled, OIDC_ISSUER: "https://auth.example.com/?realm=x" })).toContain(
			"OIDC_ISSUER must not carry a query string or fragment"
		);
	});

	// The redirect URI carries the authorization code back through the browser, so it is held to
	// the same transport requirement as the issuer.
	it("rejects an http redirect uri unless insecure issuers are allowed", () => {
		const local = { ...enabled, OIDC_REDIRECT_URI: "http://localhost:52345/api/v1/auth/sso/callback" };
		expect(paths(local)).toEqual(["OIDC_REDIRECT_URI"]);
		expect(oidcEnvSchema.safeParse({ ...local, OIDC_ALLOW_INSECURE_ISSUER: "true" }).success).toBe(true);
	});

	// A wrong path would otherwise surface as an opaque invalid_grant on the first sign-in.
	it("rejects a redirect uri that does not point at the callback route", () => {
		expect(paths({ ...enabled, OIDC_REDIRECT_URI: "https://checkmate.example.com/callback" })).toEqual(["OIDC_REDIRECT_URI"]);
	});

	// superadmin would make auto-provisioning mint an instance owner; a demo user cannot be deleted through the API.
	it("only allows user and admin as the auto-provision role", () => {
		expect(oidcEnvSchema.safeParse({ OIDC_DEFAULT_ROLE: "admin" }).success).toBe(true);
		expect(oidcEnvSchema.safeParse({ OIDC_DEFAULT_ROLE: "superadmin" }).success).toBe(false);
		expect(oidcEnvSchema.safeParse({ OIDC_DEFAULT_ROLE: "demo" }).success).toBe(false);
	});
});
