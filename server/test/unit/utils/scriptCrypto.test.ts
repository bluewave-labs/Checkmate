import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { encryptScriptBody, decryptScriptBody, hashScriptBody, verifyScriptBodyHash, resetKeyCacheForTests } from "../../../src/utils/scriptCrypto.ts";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const OTHER_KEY = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

describe("scriptCrypto", () => {
	let originalKey: string | undefined;

	beforeEach(() => {
		originalKey = process.env.SCRIPT_ENCRYPTION_KEY;
		process.env.SCRIPT_ENCRYPTION_KEY = TEST_KEY;
		resetKeyCacheForTests();
	});

	afterEach(() => {
		if (originalKey === undefined) {
			delete process.env.SCRIPT_ENCRYPTION_KEY;
		} else {
			process.env.SCRIPT_ENCRYPTION_KEY = originalKey;
		}
		resetKeyCacheForTests();
	});

	describe("encryptScriptBody / decryptScriptBody", () => {
		it("round-trips a plaintext", () => {
			const plaintext = "echo hello";
			const ciphertext = encryptScriptBody(plaintext);
			expect(typeof ciphertext).toBe("string");
			expect(ciphertext).not.toContain(plaintext);
			expect(decryptScriptBody(ciphertext)).toBe(plaintext);
		});

		it("produces a different ciphertext for the same plaintext (random IV)", () => {
			const plaintext = "echo hello";
			const c1 = encryptScriptBody(plaintext);
			const c2 = encryptScriptBody(plaintext);
			expect(c1).not.toBe(c2);
			expect(decryptScriptBody(c1)).toBe(plaintext);
			expect(decryptScriptBody(c2)).toBe(plaintext);
		});

		it("rejects tampered ciphertext", () => {
			const plaintext = "echo hello";
			const ciphertext = encryptScriptBody(plaintext);
			const decoded = JSON.parse(Buffer.from(ciphertext, "base64").toString("utf8"));
			decoded.ciphertext = "00".repeat(decoded.ciphertext.length / 2);
			const tampered = Buffer.from(JSON.stringify(decoded), "utf8").toString("base64");
			expect(() => decryptScriptBody(tampered)).toThrow();
		});

		it("fails to decrypt with a different key", () => {
			const plaintext = "echo hello";
			const ciphertext = encryptScriptBody(plaintext);
			process.env.SCRIPT_ENCRYPTION_KEY = OTHER_KEY;
			resetKeyCacheForTests();
			expect(() => decryptScriptBody(ciphertext)).toThrow();
		});
	});

	describe("hashScriptBody / verifyScriptBodyHash", () => {
		it("hashes deterministically", () => {
			expect(hashScriptBody("abc")).toBe(hashScriptBody("abc"));
		});

		it("verifies the hash", () => {
			const plaintext = "echo hello";
			const hash = hashScriptBody(plaintext);
			expect(verifyScriptBodyHash(plaintext, hash)).toBe(true);
			expect(verifyScriptBodyHash("different", hash)).toBe(false);
		});

		it("returns false for invalid hash format", () => {
			expect(verifyScriptBodyHash("anything", "not-hex")).toBe(false);
		});
	});

	describe("missing key", () => {
		it("throws on encrypt when SCRIPT_ENCRYPTION_KEY is missing", () => {
			delete process.env.SCRIPT_ENCRYPTION_KEY;
			resetKeyCacheForTests();
			expect(() => encryptScriptBody("x")).toThrow();
		});
	});
});
