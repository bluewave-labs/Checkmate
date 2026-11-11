import crypto from "node:crypto";
import fs from "node:fs";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { CONNECT_RECOVERY_KEY_FORMAT, type ConnectSealedArchive } from "@/domain/connect/connect-backup.type.js";

const MAGIC = Buffer.from(CONNECT_RECOVERY_KEY_FORMAT);
const BACKUP_KEY_INFO = "checkmate-connect-backup-v1";
const KEY_ID_INFO = "checkmate-connect-key-id-v1";
const BACKUP_KEY_BYTES = 32;
const KEY_ID_BYTES = 16;
const SALT_BYTES = 16;
const NONCE_BYTES = 12;

const deriveBackupKey = (recoveryKey: string, salt: Buffer): Buffer =>
	Buffer.from(crypto.hkdfSync("sha256", Buffer.from(recoveryKey, "hex"), salt, BACKUP_KEY_INFO, BACKUP_KEY_BYTES));

export const recoveryKeyId = (recoveryKey: string): string =>
	Buffer.from(crypto.hkdfSync("sha256", Buffer.from(recoveryKey, "hex"), Buffer.alloc(0), KEY_ID_INFO, KEY_ID_BYTES)).toString("hex");

export const encryptToFile = async (
	input: Readable,
	outFile: string,
	recoveryKey: string,
	onBytes: (sizeBytes: number) => void
): Promise<ConnectSealedArchive> => {
	const salt = crypto.randomBytes(SALT_BYTES);
	const nonce = crypto.randomBytes(NONCE_BYTES);
	const cipher = crypto.createCipheriv("aes-256-gcm", deriveBackupKey(recoveryKey, salt), nonce);
	const hash = crypto.createHash("sha256");
	const header = Buffer.concat([MAGIC, salt, nonce]);
	let sizeBytes = header.length;
	hash.update(header);
	await fs.promises.writeFile(outFile, header, { mode: 0o600 });

	cipher.on("data", (chunk: Buffer) => {
		hash.update(chunk);
		sizeBytes += chunk.length;
		onBytes(sizeBytes);
	});
	await pipeline(input, cipher, fs.createWriteStream(outFile, { flags: "a" }));

	const tag = cipher.getAuthTag();
	hash.update(tag);
	sizeBytes += tag.length;
	await fs.promises.appendFile(outFile, tag);
	return { sizeBytes, sha256: hash.digest("hex") };
};
