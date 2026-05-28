import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { AppError } from "@/utils/AppError.js";

// scriptCrypto provides AES-256-GCM encryption for script bodies stored
// at rest, plus SHA-256 hashing for tamper detection before execution.
//
// The encryption key is loaded once from SCRIPT_ENCRYPTION_KEY (a 64-char
// hex string = 32 bytes). The key never appears in logs or errors.
// Plaintext never appears in logs.
//
// Ciphertext envelope is a base64-encoded JSON object:
//   { "iv": "<hex 24>", "ciphertext": "<hex>", "authTag": "<hex 32>" }
// This format makes the value self-describing and lets us rotate
// algorithms in the future without a schema migration.

const SERVICE_NAME = "scriptCrypto";
const ALGORITHM = "aes-256-gcm";
const KEY_BYTE_LENGTH = 32;
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;

interface EncryptedEnvelope {
	iv: string;
	ciphertext: string;
	authTag: string;
}

let cachedKey: Buffer | null = null;

const loadKey = (): Buffer => {
	if (cachedKey) {
		return cachedKey;
	}
	const raw = process.env.SCRIPT_ENCRYPTION_KEY;
	if (!raw) {
		throw new AppError({
			message: "SCRIPT_ENCRYPTION_KEY is not configured",
			service: SERVICE_NAME,
			method: "loadKey",
			status: 500,
		});
	}
	if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
		throw new AppError({
			message: "SCRIPT_ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)",
			service: SERVICE_NAME,
			method: "loadKey",
			status: 500,
		});
	}
	const buf = Buffer.from(raw, "hex");
	if (buf.length !== KEY_BYTE_LENGTH) {
		throw new AppError({
			message: "SCRIPT_ENCRYPTION_KEY has invalid byte length",
			service: SERVICE_NAME,
			method: "loadKey",
			status: 500,
		});
	}
	cachedKey = buf;
	return cachedKey;
};

export const encryptScriptBody = (plaintext: string): string => {
	if (typeof plaintext !== "string") {
		throw new AppError({ message: "Plaintext must be a string", service: SERVICE_NAME, method: "encryptScriptBody", status: 400 });
	}
	const key = loadKey();
	const iv = randomBytes(IV_BYTE_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	if (authTag.length !== AUTH_TAG_BYTE_LENGTH) {
		throw new AppError({ message: "Unexpected GCM auth tag length", service: SERVICE_NAME, method: "encryptScriptBody", status: 500 });
	}
	const envelope: EncryptedEnvelope = {
		iv: iv.toString("hex"),
		ciphertext: ciphertext.toString("hex"),
		authTag: authTag.toString("hex"),
	};
	return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64");
};

export const decryptScriptBody = (ciphertextEnvelope: string): string => {
	if (typeof ciphertextEnvelope !== "string" || ciphertextEnvelope.length === 0) {
		throw new AppError({ message: "Invalid ciphertext", service: SERVICE_NAME, method: "decryptScriptBody", status: 400 });
	}
	let envelope: EncryptedEnvelope;
	try {
		const decoded = Buffer.from(ciphertextEnvelope, "base64").toString("utf8");
		envelope = JSON.parse(decoded) as EncryptedEnvelope;
	} catch {
		throw new AppError({ message: "Malformed ciphertext envelope", service: SERVICE_NAME, method: "decryptScriptBody", status: 400 });
	}
	if (!envelope.iv || !envelope.ciphertext || !envelope.authTag) {
		throw new AppError({ message: "Ciphertext envelope missing fields", service: SERVICE_NAME, method: "decryptScriptBody", status: 400 });
	}
	const key = loadKey();
	const iv = Buffer.from(envelope.iv, "hex");
	const ciphertext = Buffer.from(envelope.ciphertext, "hex");
	const authTag = Buffer.from(envelope.authTag, "hex");
	if (iv.length !== IV_BYTE_LENGTH || authTag.length !== AUTH_TAG_BYTE_LENGTH) {
		throw new AppError({ message: "Ciphertext envelope has invalid sizes", service: SERVICE_NAME, method: "decryptScriptBody", status: 400 });
	}
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);
	try {
		const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
		return plaintext.toString("utf8");
	} catch {
		// Generic message – do not leak crypto details
		throw new AppError({ message: "Failed to decrypt script body", service: SERVICE_NAME, method: "decryptScriptBody", status: 500 });
	}
};

export const hashScriptBody = (plaintext: string): string => {
	return createHash("sha256").update(plaintext, "utf8").digest("hex");
};

export const verifyScriptBodyHash = (plaintext: string, hash: string): boolean => {
	const computed = Buffer.from(hashScriptBody(plaintext), "hex");
	let expected: Buffer;
	try {
		expected = Buffer.from(hash, "hex");
	} catch {
		return false;
	}
	if (computed.length !== expected.length) {
		return false;
	}
	return timingSafeEqual(computed, expected);
};

// resetKeyCacheForTests is exported only for unit tests that need to swap
// the SCRIPT_ENCRYPTION_KEY env var between assertions. Not intended for
// production code paths.
export const resetKeyCacheForTests = (): void => {
	cachedKey = null;
};
