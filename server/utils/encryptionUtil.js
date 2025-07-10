import crypto from "crypto";

// --- Configuration ---
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16

const JWT_SECRET = process.env.JWT_SECRET || "my_secret";

const ENCRYPTION_KEY = crypto.createHash("sha256").update(String(JWT_SECRET)).digest();

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * The output format is "iv:encryptedData" in hex for easy storage.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string|null} The encrypted string or null if the input is empty.
 */
export const encrypt = (text) => {
	if (!text) {
		return null;
	}
	try {
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
		let encrypted = cipher.update(text);
		encrypted = Buffer.concat([encrypted, cipher.final()]);
		return iv.toString("hex") + ":" + encrypted.toString("hex");
	} catch (error) {
		console.error("Encryption failed:", error);
		return null;
	}
};

/**
 * Decrypts an "iv:encryptedData" string using AES-256-CBC.
 * @param {string} text - The encrypted text to decrypt.
 * @returns {string|null} The decrypted plaintext or null if decryption fails.
 */
export const decrypt = (text) => {
	if (!text) {
		return null;
	}

	if (!text.includes(":")) {
		return text;
	}

	try {
		const textParts = text.split(":");
		const iv = Buffer.from(textParts.shift(), "hex");
		const encryptedText = Buffer.from(textParts.join(":"), "hex");
		const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
		let decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		return decrypted.toString();
	} catch (error) {
		console.error("Decryption failed. Ensure JWT_SECRET is consistent.", error);
		return null;
	}
};
