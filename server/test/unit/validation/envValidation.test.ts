import { describe, expect, it } from "@jest/globals";
import { randomBytes } from "node:crypto";
import { encryptionKeyList } from "../../../src/config/envValidation.ts";

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
