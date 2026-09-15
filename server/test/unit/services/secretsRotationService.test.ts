import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { SecretsRotationService } from "../../../src/service/encryption/secretsRotationService.ts";
import type { IMonitorsRepository } from "../../../src/domain/monitors/monitor.repository.interface.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

type Row = { id: string; dockerTlsKey: string };

const PLAINTEXT = "-----BEGIN PRIVATE KEY-----\nstub\n-----END PRIVATE KEY-----";

const newKey = () => nodeCrypto.randomBytes(32);

const encryptionServiceFor = (keys: Buffer[]) => new EncryptionService(keys, createMockLogger(), nodeCrypto);

const tamperData = (ciphertext: string) => {
	const parts = ciphertext.split(".");
	const data = parts[4] ?? "";
	parts[4] = (data[0] === "A" ? "B" : "A") + data.slice(1);
	return parts.join(".");
};

const setup = (keys: Buffer[], rows: Row[]) => {
	const encryptionService = encryptionServiceFor(keys);
	const repository = {
		findAllDockerTlsKeys: jest.fn(async () => rows),
		updateDockerTlsKey: jest.fn(async () => undefined),
	};
	const logger = createMockLogger();
	const service = new SecretsRotationService(repository as unknown as IMonitorsRepository, encryptionService, logger);
	return { service, encryptionService, repository, logger };
};

const updatedKeyFor = (repository: { updateDockerTlsKey: jest.Mock }, id: string): string => {
	const call = repository.updateDockerTlsKey.mock.calls.find(([calledId]) => calledId === id);
	expect(call).toBeDefined();
	return (call as [string, string])[1];
};

describe("SecretsRotationService", () => {
	it("re-encrypts stale rows under the current key and leaves current rows untouched", async () => {
		const current = newKey();
		const previous = newKey();
		const stale = encryptionServiceFor([previous]);
		const rows = [
			{ id: "m-current", dockerTlsKey: encryptionServiceFor([current]).encrypt(PLAINTEXT) },
			{ id: "m-stale-1", dockerTlsKey: stale.encrypt(PLAINTEXT) },
			{ id: "m-stale-2", dockerTlsKey: stale.encrypt(PLAINTEXT) },
		];
		const { service, encryptionService, repository, logger } = setup([current, previous], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 3, reencrypted: 2, skipped: 0 });
		expect(repository.updateDockerTlsKey).toHaveBeenCalledTimes(2);
		for (const id of ["m-stale-1", "m-stale-2"]) {
			const rotated = updatedKeyFor(repository, id);
			expect(encryptionService.keyIdOf(rotated)).toBe(encryptionService.currentKeyId());
			expect(encryptionService.decrypt(rotated)).toBe(PLAINTEXT);
		}
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalledWith("m-current", expect.anything());
		expect(logger.warn).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith(
			expect.objectContaining({ message: "Docker TLS key rotation: 2 re-encrypted, 0 skipped, 3 scanned", service: "SecretsRotationService" })
		);
	});

	it("returns zero counts when every row is already under the current key", async () => {
		const current = newKey();
		const rows = [
			{ id: "m-1", dockerTlsKey: encryptionServiceFor([current]).encrypt(PLAINTEXT) },
			{ id: "m-2", dockerTlsKey: encryptionServiceFor([current]).encrypt(PLAINTEXT) },
		];
		const { service, repository, logger } = setup([current], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 2, reencrypted: 0, skipped: 0 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Docker TLS key rotation: 0 re-encrypted, 0 skipped, 2 scanned" }));
	});

	it("skips a row encrypted under an unknown key and logs its key id", async () => {
		const unknown = encryptionServiceFor([newKey()]);
		const rows = [{ id: "m-unknown", dockerTlsKey: unknown.encrypt(PLAINTEXT) }];
		const { service, repository, logger } = setup([newKey()], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 1, reencrypted: 0, skipped: 1 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("Could not reencrypt Docker TLS key for monitor m-unknown"),
				service: "SecretsRotationService",
				details: { monitorId: "m-unknown", keyId: unknown.currentKeyId() },
			})
		);
	});

	it("continues past a row that fails to decrypt", async () => {
		const current = newKey();
		const previous = newKey();
		const stale = encryptionServiceFor([previous]);
		const rows = [
			{ id: "m-broken", dockerTlsKey: tamperData(stale.encrypt(PLAINTEXT)) },
			{ id: "m-stale", dockerTlsKey: stale.encrypt(PLAINTEXT) },
		];
		const { service, encryptionService, repository, logger } = setup([current, previous], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 2, reencrypted: 1, skipped: 1 });
		expect(repository.updateDockerTlsKey).toHaveBeenCalledTimes(1);
		expect(encryptionService.decrypt(updatedKeyFor(repository, "m-stale"))).toBe(PLAINTEXT);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("Could not reencrypt Docker TLS key for monitor m-broken: Ciphertext failed authentication"),
				details: expect.objectContaining({ monitorId: "m-broken" }),
			})
		);
		expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "Docker TLS key rotation: 1 re-encrypted, 1 skipped, 2 scanned" }));
	});

	it("warns and skips every row when ENCRYPTION_KEY is not configured", async () => {
		const rows = [
			{ id: "m-1", dockerTlsKey: encryptionServiceFor([newKey()]).encrypt(PLAINTEXT) },
			{ id: "m-2", dockerTlsKey: encryptionServiceFor([newKey()]).encrypt(PLAINTEXT) },
		];
		const { service, repository, logger } = setup([], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 2, reencrypted: 0, skipped: 2 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "2 monitor(s) have a stored Docker TLS key but ENCRYPTION_KEY is not set; their checks will fail until it is",
				service: "SecretsRotationService",
			})
		);
		expect(logger.info).not.toHaveBeenCalled();
	});

	it("logs nothing when ENCRYPTION_KEY is not configured and there are no rows", async () => {
		const { service, repository, logger } = setup([], []);

		const result = await service.run();

		expect(result).toEqual({ scanned: 0, reencrypted: 0, skipped: 0 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.warn).not.toHaveBeenCalled();
		expect(logger.info).not.toHaveBeenCalled();
	});
});
