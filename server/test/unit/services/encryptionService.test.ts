import { describe, expect, it } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import type { EncryptionCryptoLib } from "../../../src/service/encryption/encryptionService.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const newKey = () => nodeCrypto.randomBytes(32);

const setup = (keys: Buffer[], cryptoLib: EncryptionCryptoLib = nodeCrypto) => {
	const logger = createMockLogger();
	const service = new EncryptionService(keys, logger, cryptoLib);
	return { service, logger };
};

const expectAppError = (fn: () => unknown, message: string, details?: Record<string, unknown>) => {
	let caught: unknown;
	try {
		fn();
	} catch (error) {
		caught = error;
	}
	expect(caught).toBeInstanceOf(AppError);
	const appError = caught as AppError;
	expect(appError.message).toBe(message);
	expect(appError.status).toBe(500);
	expect(appError.service).toBe("EncryptionService");
	if (details) expect(appError.details).toEqual(details);
};

const tamper = (ciphertext: string, segment: number, replacer: (value: string) => string) => {
	const parts = ciphertext.split(".");
	parts[segment] = replacer(parts[segment] ?? "");
	return parts.join(".");
};

const flipFirstChar = (value: string) => (value[0] === "A" ? "B" : "A") + value.slice(1);

describe("EncryptionService", () => {
	describe("construction", () => {
		it("is unconfigured with no keys and says so", () => {
			const { service, logger } = setup([]);
			expect(service.isConfigured()).toBe(false);
			expectAppError(() => service.currentKeyId(), "ENCRYPTION_KEY is not configured");
			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "ENCRYPTION_KEY not set; encrypted fields are unavailable" }));
		});

		it("is configured with one key and exposes a 6-character base64url key id", () => {
			const { service, logger } = setup([newKey()]);
			expect(service.isConfigured()).toBe(true);
			expect(service.currentKeyId()).toMatch(/^[A-Za-z0-9_-]{6}$/);
			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Encryption configured with 1 key(s)") }));
		});

		it("rejects an entry that is not 32 bytes, naming its index", () => {
			const short = nodeCrypto.randomBytes(31);
			const long = nodeCrypto.randomBytes(33);
			expectAppError(() => setup([newKey(), short]), "ENCRYPTION_KEY is not 32 bytes", { keyIdx: 1 });
			expectAppError(() => setup([long]), "ENCRYPTION_KEY is not 32 bytes", { keyIdx: 0 });
		});

		it("rejects the same key listed twice", () => {
			const key = newKey();
			expectAppError(() => setup([key, key]), "ENCRYPTION_KEY key ids collide; regenerate one key", { index: 1 });
		});

		it("treats the first key as current", () => {
			const a = newKey();
			const b = newKey();
			const { service: onlyA } = setup([a]);
			const { service: onlyB } = setup([b]);
			const { service: bThenA } = setup([b, a]);
			expect(bThenA.currentKeyId()).toBe(onlyB.currentKeyId());
			expect(bThenA.currentKeyId()).not.toBe(onlyA.currentKeyId());
		});
	});

	describe("round trip", () => {
		it.each([
			["ascii", "hello"],
			["pem-shaped", "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\n-----END PRIVATE KEY-----\n"],
			["multi-byte utf-8", "clé privée — 秘密鍵 🔑"],
			["empty", ""],
		])("decrypts what it encrypted (%s)", (_label, plaintext) => {
			const { service } = setup([newKey()]);
			expect(service.decrypt(service.encrypt(plaintext))).toBe(plaintext);
		});

		it("uses a fresh IV per call so equal plaintexts encrypt differently", () => {
			const { service } = setup([newKey()]);
			const first = service.encrypt("same");
			const second = service.encrypt("same");
			expect(first).not.toBe(second);
			expect(service.decrypt(first)).toBe("same");
			expect(service.decrypt(second)).toBe("same");
		});

		it("produces the documented five-segment base64url form", () => {
			const { service } = setup([newKey()]);
			expect(service.encrypt("x")).toMatch(/^v1\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]*$/);
		});

		it("does not leak the plaintext into the stored form", () => {
			const { service } = setup([newKey()]);
			const ciphertext = service.encrypt("-----BEGIN PRIVATE KEY-----");
			expect(ciphertext).not.toContain("PRIVATE");
			expect(Buffer.from(ciphertext.split(".")[4] ?? "", "base64url").toString("utf8")).not.toContain("PRIVATE");
		});

		it("is deterministic for a fixed IV, pinning the format", () => {
			const fixedIv = Buffer.alloc(12, 7);
			const cryptoLib: EncryptionCryptoLib = {
				createCipheriv: nodeCrypto.createCipheriv,
				createDecipheriv: nodeCrypto.createDecipheriv,
				createHash: nodeCrypto.createHash,
				randomBytes: () => fixedIv,
			};
			const key = newKey();
			const { service } = setup([key], cryptoLib);
			const first = service.encrypt("pinned");
			const second = service.encrypt("pinned");
			expect(first).toBe(second);
			expect(first.split(".")[2]).toBe(fixedIv.toString("base64url"));
			expect(setup([key]).service.decrypt(first)).toBe("pinned");
		});
	});

	describe("key selection and rotation", () => {
		it("decrypts with a key that is not first in the list and reports it needs re-encryption", () => {
			const a = newKey();
			const b = newKey();
			const { service: withA } = setup([a]);
			const ciphertext = withA.encrypt("secret");

			const { service: withBThenA } = setup([b, a]);
			expect(withBThenA.decrypt(ciphertext)).toBe("secret");
			expect(withBThenA.keyIdOf(ciphertext)).toBe(withA.currentKeyId());
			expect(withBThenA.needsReencryption(ciphertext)).toBe(true);
		});

		it("encrypts under the first key and does not flag it for re-encryption", () => {
			const { service } = setup([newKey(), newKey()]);
			const ciphertext = service.encrypt("secret");
			expect(service.keyIdOf(ciphertext)).toBe(service.currentKeyId());
			expect(service.needsReencryption(ciphertext)).toBe(false);
		});

		it("fails with the key id when no listed key matches, but keyIdOf still answers", () => {
			const a = newKey();
			const { service: withA } = setup([a]);
			const ciphertext = withA.encrypt("secret");
			const idOfA = withA.currentKeyId();

			const { service: withB } = setup([newKey()]);
			expectAppError(() => withB.decrypt(ciphertext), "No encryption key matches ciphertext", { keyId: idOfA });
			expect(withB.keyIdOf(ciphertext)).toBe(idOfA);
		});
	});

	describe("tampering and malformed input", () => {
		it("rejects a modified data segment", () => {
			const { service } = setup([newKey()]);
			const ciphertext = service.encrypt("payload");
			expectAppError(() => service.decrypt(tamper(ciphertext, 4, flipFirstChar)), "Ciphertext failed authentication");
		});

		it("rejects a modified tag segment", () => {
			const { service } = setup([newKey()]);
			const ciphertext = service.encrypt("payload");
			expectAppError(() => service.decrypt(tamper(ciphertext, 3, flipFirstChar)), "Ciphertext failed authentication");
		});

		it("rejects a modified iv segment", () => {
			const { service } = setup([newKey()]);
			const ciphertext = service.encrypt("payload");
			expectAppError(() => service.decrypt(tamper(ciphertext, 2, flipFirstChar)), "Ciphertext failed authentication");
		});

		it("rejects a ciphertext relabelled with another listed key's id", () => {
			const a = newKey();
			const b = newKey();
			const { service } = setup([a, b]);
			const ciphertext = service.encrypt("payload");
			const idOfB = setup([b]).service.currentKeyId();
			expectAppError(() => service.decrypt(tamper(ciphertext, 1, () => idOfB)), "Ciphertext failed authentication");
		});

		it("rejects a ciphertext whose key id matches a listed key made from different bytes", () => {
			const a = newKey();
			const b = newKey();
			const ciphertext = setup([a]).service.encrypt("payload");
			const { service: withB } = setup([b]);
			const forged = tamper(ciphertext, 1, () => withB.currentKeyId());
			expectAppError(() => withB.decrypt(forged), "Ciphertext failed authentication");
		});

		it.each([
			["too few segments", "v1.abc.def"],
			["too many segments", "v1.a.b.c.d.e"],
			["empty key id", "v1..AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAA.AA"],
			["standard base64 padding", "v1.abcdef.AAAAAAAAAAAAAAA=.AAAAAAAAAAAAAAAAAAAAAA.AA"],
			["plus sign in a segment", "v1.abcdef.AAAAAAAAAAAAAA+A.AAAAAAAAAAAAAAAAAAAAAA.AA"],
			["iv of the wrong length", "v1.abcdef.AAAA.AAAAAAAAAAAAAAAAAAAAAA.AA"],
			["tag of the wrong length", "v1.abcdef.AAAAAAAAAAAAAAAA.AAAA.AA"],
		])("rejects malformed v1 input (%s)", (_label, input) => {
			const { service } = setup([newKey()]);
			expectAppError(() => service.decrypt(input), "Ciphertext is malformed");
			expectAppError(() => service.keyIdOf(input), "Ciphertext is malformed");
		});

		it.each([
			["empty string", "", ""],
			["no version segment", "abcdef.AAAA.AAAA.AA", "abcdef"],
			["future version with a different layout", "v2.x.y.z.w.v.u", "v2"],
		])("reports the version before any layout rule (%s)", (_label, input, version) => {
			const { service } = setup([newKey()]);
			expectAppError(() => service.decrypt(input), "Unsupported ciphertext version", { version });
			expectAppError(() => service.keyIdOf(input), "Unsupported ciphertext version", { version });
		});
	});

	describe("unconfigured service", () => {
		it("refuses to encrypt, decrypt, or evaluate rotation", () => {
			const { service: configured } = setup([newKey()]);
			const ciphertext = configured.encrypt("x");
			const { service } = setup([]);
			expectAppError(() => service.encrypt("x"), "ENCRYPTION_KEY is not configured");
			expectAppError(() => service.decrypt(ciphertext), "ENCRYPTION_KEY is not configured");
			expectAppError(() => service.needsReencryption(ciphertext), "ENCRYPTION_KEY is not configured");
		});

		it("still parses a key id out of a well-formed ciphertext", () => {
			const { service: configured } = setup([newKey()]);
			const ciphertext = configured.encrypt("x");
			const { service } = setup([]);
			expect(service.keyIdOf(ciphertext)).toBe(configured.currentKeyId());
		});
	});
});
