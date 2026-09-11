import { ILogger } from "@/utils/logger.js";
import type * as nodeCrypto from "node:crypto";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "EncryptionService";

const ENCRYPTION_KEY_BYTES = 32;

// Encryption consts
const FORMAT_VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_ID_BYTES = 4;
const SEGMENT_COUNT = 5;
type V1Segments = [string, string, string, string, string];
const isV1Segments = (segments: string[]): segments is V1Segments => segments.length === SEGMENT_COUNT;
const BASE64URL = /^[A-Za-z0-9_-]*$/;

type KeyEntry = { id: string; key: Buffer };

export type EncryptionCryptoLib = Pick<typeof nodeCrypto, "createCipheriv" | "createDecipheriv" | "createHash" | "randomBytes">;

export interface IEncryptionService {
	isConfigured(): boolean;
	currentKeyId(): string;
	keyIdOf(ciphertext: string): string;
	needsReencryption(ciphertext: string): boolean;
	encrypt(plaintext: string): string;
	decrypt(ciphertext: string): string;
}

export class EncryptionService implements IEncryptionService {
	static SERVICE_NAME = SERVICE_NAME;

	private readonly entries: KeyEntry[];

	constructor(
		keys: Buffer[],
		private logger: ILogger,
		private cryptoLib: EncryptionCryptoLib
	) {
		this.entries = keys.map((key, index) => this.toEntry(key, index));
		this.entries.forEach((entry, index) => {
			if (this.entries.findIndex((other) => other.id === entry.id) !== index) {
				throw this.fail("constructor", "ENCRYPTION_KEY key ids collide; regenerate one key", { index });
			}
		});

		const current = this.entries[0];

		this.logger.info({
			message: current
				? `Encryption configured with ${this.entries.length} key(s); current key id ${current.id}`
				: "ENCRYPTION_KEY not set; encrypted fields are unavailable",
			service: SERVICE_NAME,
			method: "constructor",
		});
	}

	isConfigured = () => {
		return this.entries.length > 0;
	};

	currentKeyId = () => {
		return this.requireCurrentKey("currentKeyId").id;
	};

	keyIdOf = (ciphertext: string) => {
		return this.parse(ciphertext, "keyIdOf").keyId;
	};

	// Check if the ciphertext was encrypted with the current key
	needsReencryption = (ciphertext: string) => {
		const currentKey = this.requireCurrentKey("needsReencryption");
		return this.parse(ciphertext, "needsReencryption").keyId !== currentKey.id;
	};

	encrypt = (plaintext: string) => {
		const currentKey = this.requireCurrentKey("encrypt"); // Get the current key for encryption
		const iv = this.cryptoLib.randomBytes(IV_BYTES); // Get IV_BYTES worth of random bytes for nonce
		const cipher = this.cryptoLib.createCipheriv(ALGORITHM, currentKey.key, iv, { authTagLength: TAG_BYTES }); // Create the cipher
		cipher.setAAD(this.aad(currentKey.id)); // set signing key as additional data so it is protected by the verification tag
		const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]); // Encode plaintext as utf8 and run through cipher
		const tag = cipher.getAuthTag(); // Get verification tag
		return [FORMAT_VERSION, currentKey.id, iv.toString("base64url"), tag.toString("base64url"), data.toString("base64url")].join(".");
	};

	decrypt = (ciphertext: string) => {
		this.requireCurrentKey("decrypt"); // Config check
		const { keyId, iv, tag, data } = this.parse(ciphertext, "decrypt");
		const key = this.entries.find((entry) => entry.id === keyId)?.key;
		if (!key) {
			throw this.fail("decrypt", "No encryption key matches ciphertext", { keyId });
		}
		const decipher = this.cryptoLib.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES });
		decipher.setAAD(this.aad(keyId)); // reconstruct the additional data, must be done BEFORE auth tag
		decipher.setAuthTag(tag); // Give the decipher the tag to verify
		try {
			return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
		} catch {
			throw this.fail("decrypt", "Ciphertext failed authentication");
		}
	};

	private fail = (method: string, message: string, details?: Record<string, unknown>): AppError => {
		return new AppError({
			message,
			status: 500,
			service: SERVICE_NAME,
			method,
			details,
		});
	};

	// Create an ID:Key pair for each key.
	private toEntry = (key: Buffer, keyIdx: number): KeyEntry => {
		if (key.length !== ENCRYPTION_KEY_BYTES) throw this.fail("constructor", "ENCRYPTION_KEY is not 32 bytes", { keyIdx });

		const id = this.cryptoLib
			.createHash("sha256") // Create a sha256 hasher
			.update(key) // Feed it the key
			.digest() // Digest a hash
			.subarray(0, KEY_ID_BYTES) // Keep first KEY_ID_BYTES, enough to avoid collision
			.toString("base64url");
		return { id, key };
	};

	private requireCurrentKey = (method: string): KeyEntry => {
		const current = this.entries[0];
		if (!current) {
			throw this.fail(method, "ENCRYPTION_KEY is not configured");
		}
		return current;
	};

	// v1 Ciphertext stored as a string with five segments:
	// <version>.<keyId>.<iv>.<tag>.<encryptedData>
	// iv and tag belong to aes-256-gcm standard

	private parse = (ciphertext: string, method: string) => {
		const segments = ciphertext.split(".");
		const version = segments[0];
		if (version !== FORMAT_VERSION) {
			throw this.fail(method, "Unsupported ciphertext version", { version });
		}

		// **************************
		// v1 parser
		// **************************
		if (!isV1Segments(segments)) {
			throw this.fail(method, "Ciphertext is malformed");
		}

		const [, keyId, ivText, tagText, dataText] = segments; // Skip first segment, we already have version

		if (![keyId, ivText, tagText, dataText].every((segment) => BASE64URL.test(segment))) {
			throw this.fail(method, "Ciphertext is malformed");
		}

		const iv = Buffer.from(ivText, "base64url");
		const tag = Buffer.from(tagText, "base64url");

		if (keyId.length === 0 || iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
			throw this.fail(method, "Ciphertext is malformed");
		}
		return { keyId, iv, tag, data: Buffer.from(dataText, "base64url") };
		// **************************
		// End v1 parser
		// **************************
	};

	private aad = (keyId: string) => {
		return Buffer.from(`${FORMAT_VERSION}.${keyId}`, "utf8");
	};
}
