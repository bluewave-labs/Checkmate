import { describe, expect, it } from "@jest/globals";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { decryptFile, encryptToFile, recoveryKeyId } from "../../../src/domain/connect/connect.backup-format.ts";

const KEY = "ab".repeat(32);
const HEADER_LEN = 33;
const TAG_LEN = 16;

const backupKey = (recoveryKey: string, salt: Buffer) =>
	Buffer.from(crypto.hkdfSync("sha256", Buffer.from(recoveryKey, "hex"), salt, "checkmate-connect-backup-v1", 32));

const open = (file: Buffer, recoveryKey: string): Buffer => {
	const decipher = crypto.createDecipheriv("aes-256-gcm", backupKey(recoveryKey, file.subarray(5, 21)), file.subarray(21, HEADER_LEN));
	decipher.setAuthTag(file.subarray(file.length - TAG_LEN));
	return Buffer.concat([decipher.update(file.subarray(HEADER_LEN, file.length - TAG_LEN)), decipher.final()]);
};

const withDir = async (work: (dir: string) => Promise<void>) => {
	const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "connect-format-"));
	try {
		await work(dir);
	} finally {
		await fs.promises.rm(dir, { recursive: true, force: true });
	}
};

describe("recoveryKeyId", () => {
	it("keeps the fingerprint existing cloud backups carry", () => {
		expect(recoveryKeyId("00".repeat(32))).toBe("01cb3723a168c4d02d82f4dcebb4b061");
		expect(recoveryKeyId(KEY)).toBe("9860f9a01bc4cf8231bdef1e2ec40b45");
	});

	it("does not reveal the key", () => {
		expect(recoveryKeyId(KEY)).not.toContain(KEY.slice(0, 32));
	});
});

describe("encryptToFile", () => {
	it("keeps the key derivation of existing CMKB1 backups", () => {
		expect(backupKey("00".repeat(32), Buffer.alloc(16)).toString("hex")).toBe("8889fac04828176b7e78fee78c1d0bd8aa6fd433913eb1b7f64e8474c55f0a36");
	});

	it("writes magic, salt, nonce, ciphertext and tag that decrypt with the recovery key", async () => {
		await withDir(async (dir) => {
			const out = path.join(dir, "backup.cmkb");
			const plain = crypto.randomBytes(200_000);

			const sealed = await encryptToFile(Readable.from([plain.subarray(0, 50_000), plain.subarray(50_000)]), out, KEY, () => undefined);

			const file = await fs.promises.readFile(out);
			expect(file.subarray(0, 5).toString()).toBe("CMKB1");
			expect(open(file, KEY).equals(plain)).toBe(true);
			expect(sealed.sizeBytes).toBe(file.length);
			expect(sealed.sha256).toBe(crypto.createHash("sha256").update(file).digest("hex"));
		});
	});

	it("fails to open with a different key", async () => {
		await withDir(async (dir) => {
			const out = path.join(dir, "backup.cmkb");
			await encryptToFile(Readable.from([Buffer.from("archive")]), out, KEY, () => undefined);

			const file = await fs.promises.readFile(out);
			expect(() => open(file, "cd".repeat(32))).toThrow();
		});
	});

	it("uses a fresh salt and nonce for every backup", async () => {
		await withDir(async (dir) => {
			const a = path.join(dir, "a.cmkb");
			const b = path.join(dir, "b.cmkb");
			await encryptToFile(Readable.from([Buffer.from("same")]), a, KEY, () => undefined);
			await encryptToFile(Readable.from([Buffer.from("same")]), b, KEY, () => undefined);

			const [fileA, fileB] = await Promise.all([fs.promises.readFile(a), fs.promises.readFile(b)]);
			expect(fileA.subarray(5, HEADER_LEN).equals(fileB.subarray(5, HEADER_LEN))).toBe(false);
		});
	});

	it("reports a growing size and creates the file readable by its owner only", async () => {
		await withDir(async (dir) => {
			const out = path.join(dir, "backup.cmkb");
			const sizes: number[] = [];

			await encryptToFile(Readable.from([crypto.randomBytes(70_000), crypto.randomBytes(70_000)]), out, KEY, (size) => sizes.push(size));

			expect(sizes.length).toBeGreaterThan(0);
			expect(sizes).toEqual([...sizes].sort((x, y) => x - y));
			expect((await fs.promises.stat(out)).mode & 0o777).toBe(0o600);
		});
	});

	it("rejects when the input stream fails", async () => {
		await withDir(async (dir) => {
			const input = new Readable({
				read() {
					this.destroy(new Error("dump broke"));
				},
			});

			await expect(encryptToFile(input, path.join(dir, "backup.cmkb"), KEY, () => undefined)).rejects.toThrow("dump broke");
		});
	});
});

describe("decryptFile", () => {
	it("decrypts what encryptToFile sealed", async () => {
		await withDir(async (dir) => {
			const sealed = path.join(dir, "backup.cmkb");
			const out = path.join(dir, "backup.archive.gz");
			const plain = crypto.randomBytes(150_000);
			await encryptToFile(Readable.from([plain]), sealed, KEY, () => undefined);

			await expect(decryptFile(sealed, out, KEY)).resolves.toBe(true);
			expect((await fs.promises.readFile(out)).equals(plain)).toBe(true);
		});
	});

	it("reports a different key as not decrypted", async () => {
		await withDir(async (dir) => {
			const sealed = path.join(dir, "backup.cmkb");
			await encryptToFile(Readable.from([Buffer.from("archive")]), sealed, KEY, () => undefined);

			await expect(decryptFile(sealed, path.join(dir, "out"), "cd".repeat(32))).resolves.toBe(false);
		});
	});

	it("reports an altered archive as not decrypted", async () => {
		await withDir(async (dir) => {
			const sealed = path.join(dir, "backup.cmkb");
			await encryptToFile(Readable.from([crypto.randomBytes(1_000)]), sealed, KEY, () => undefined);
			const file = await fs.promises.readFile(sealed);
			file[HEADER_LEN + 10] ^= 0xff;
			await fs.promises.writeFile(sealed, file);

			await expect(decryptFile(sealed, path.join(dir, "out"), KEY)).resolves.toBe(false);
		});
	});

	it("throws for a file that is too short to be a backup", async () => {
		await withDir(async (dir) => {
			const file = path.join(dir, "short.cmkb");
			await fs.promises.writeFile(file, Buffer.from("CMKB1"));

			await expect(decryptFile(file, path.join(dir, "out"), KEY)).rejects.toThrow("backup file too short");
		});
	});

	it("throws for a file that isn't CMKB1, instead of calling it a wrong key", async () => {
		await withDir(async (dir) => {
			const file = path.join(dir, "other.bin");
			await fs.promises.writeFile(file, crypto.randomBytes(200));

			await expect(decryptFile(file, path.join(dir, "out"), KEY)).rejects.toThrow("not a CMKB1 backup");
		});
	});
});
