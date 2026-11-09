import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { SecretsRotationService } from "../../../src/service/encryption/secretsRotationService.ts";
import type { IMonitorsRepository } from "../../../src/domain/monitors/monitor.repository.interface.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

type Row = { id: string; dockerTlsKey: string };

const PLAINTEXT = "-----BEGIN PRIVATE KEY-----\nstub\n-----END PRIVATE KEY-----";
const CONNECT_TOKEN = `cmk_${"a".repeat(48)}`;

const newKey = () => nodeCrypto.randomBytes(32);

const encryptionServiceFor = (keys: Buffer[]) => new EncryptionService(keys, createMockLogger(), nodeCrypto);

const tamperData = (ciphertext: string) => {
	const parts = ciphertext.split(".");
	const data = parts[4] ?? "";
	parts[4] = (data[0] === "A" ? "B" : "A") + data.slice(1);
	return parts.join(".");
};

const setup = async (keys: Buffer[], rows: Row[], connectToken?: string) => {
	const encryptionService = encryptionServiceFor(keys);
	const repository = {
		findAllDockerTlsKeys: jest.fn(async () => rows),
		updateDockerTlsKey: jest.fn(async () => undefined),
	};
	const connectRepository = new InMemoryConnectRepository();
	if (connectToken !== undefined) {
		await connectRepository.setEnrollment({
			connectUrl: "wss://relay.checkmate.so/api/tunnel",
			agentId: "agent-1",
			token: connectToken,
			apiUrl: null,
		});
	}
	const logger = createMockLogger();
	const service = new SecretsRotationService(repository as unknown as IMonitorsRepository, connectRepository, encryptionService, logger);
	return { service, encryptionService, repository, connectRepository, logger };
};

const storedConnectToken = async (connectRepository: InMemoryConnectRepository) => (await connectRepository.get()).enrollment?.token;

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
		const { service, encryptionService, repository, logger } = await setup([current, previous], rows);

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
		expect(logger.info).toHaveBeenCalledWith({ reencrypted: 2, skipped: 0, scanned: 3 }, "Docker TLS key rotation complete");
		expect(logger.child).toHaveBeenCalledWith({ service: "SecretsRotationService" });
	});

	it("returns zero counts when every row is already under the current key", async () => {
		const current = newKey();
		const rows = [
			{ id: "m-1", dockerTlsKey: encryptionServiceFor([current]).encrypt(PLAINTEXT) },
			{ id: "m-2", dockerTlsKey: encryptionServiceFor([current]).encrypt(PLAINTEXT) },
		];
		const { service, repository, logger } = await setup([current], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 2, reencrypted: 0, skipped: 0 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith({ reencrypted: 0, skipped: 0, scanned: 2 }, "Docker TLS key rotation complete");
	});

	it("skips a row encrypted under an unknown key and logs its key id", async () => {
		const unknown = encryptionServiceFor([newKey()]);
		const rows = [{ id: "m-unknown", dockerTlsKey: unknown.encrypt(PLAINTEXT) }];
		const { service, repository, logger } = await setup([newKey()], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 1, reencrypted: 0, skipped: 1 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({ err: expect.objectContaining({ details: { keyId: unknown.currentKeyId() } }), monitorId: "m-unknown" }),
			"Could not re-encrypt Docker TLS key for monitor"
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
		const { service, encryptionService, repository, logger } = await setup([current, previous], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 2, reencrypted: 1, skipped: 1 });
		expect(repository.updateDockerTlsKey).toHaveBeenCalledTimes(1);
		expect(encryptionService.decrypt(updatedKeyFor(repository, "m-stale"))).toBe(PLAINTEXT);
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({ err: expect.objectContaining({ message: "Ciphertext failed authentication" }), monitorId: "m-broken" }),
			"Could not re-encrypt Docker TLS key for monitor"
		);
		expect(logger.info).toHaveBeenCalledWith({ reencrypted: 1, skipped: 1, scanned: 2 }, "Docker TLS key rotation complete");
	});

	it("warns and skips every row when ENCRYPTION_KEY is not configured", async () => {
		const rows = [
			{ id: "m-1", dockerTlsKey: encryptionServiceFor([newKey()]).encrypt(PLAINTEXT) },
			{ id: "m-2", dockerTlsKey: encryptionServiceFor([newKey()]).encrypt(PLAINTEXT) },
		];
		const { service, repository, logger } = await setup([], rows);

		const result = await service.run();

		expect(result).toEqual({ scanned: 2, reencrypted: 0, skipped: 2 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalledWith(
			{ count: 2 },
			"Monitors have a stored Docker TLS key but ENCRYPTION_KEY is not set; their checks will fail until it is"
		);
		expect(logger.info).not.toHaveBeenCalled();
	});

	it("logs nothing when ENCRYPTION_KEY is not configured and there are no rows", async () => {
		const { service, repository, logger } = await setup([], []);

		const result = await service.run();

		expect(result).toEqual({ scanned: 0, reencrypted: 0, skipped: 0 });
		expect(repository.updateDockerTlsKey).not.toHaveBeenCalled();
		expect(logger.warn).not.toHaveBeenCalled();
		expect(logger.info).not.toHaveBeenCalled();
	});

	describe("Checkmate Connect token", () => {
		it("re-encrypts a token sealed with an old key", async () => {
			const current = newKey();
			const previous = newKey();
			const { service, encryptionService, connectRepository, logger } = await setup(
				[current, previous],
				[],
				encryptionServiceFor([previous]).encrypt(CONNECT_TOKEN)
			);

			const result = await service.run();

			expect(result).toEqual({ scanned: 1, reencrypted: 1, skipped: 0 });
			const rotated = (await storedConnectToken(connectRepository)) ?? "";
			expect(encryptionService.keyIdOf(rotated)).toBe(encryptionService.currentKeyId());
			expect(encryptionService.decrypt(rotated)).toBe(CONNECT_TOKEN);
			expect(logger.info).toHaveBeenCalledWith("Checkmate Connect token re-encrypted");
		});

		it("rotates the token even when no monitor has a Docker TLS key", async () => {
			const current = newKey();
			const previous = newKey();
			const { service, encryptionService, connectRepository } = await setup(
				[current, previous],
				[],
				encryptionServiceFor([previous]).encrypt(CONNECT_TOKEN)
			);

			await service.run();

			expect(encryptionService.keyIdOf((await storedConnectToken(connectRepository)) ?? "")).toBe(encryptionService.currentKeyId());
		});

		it("leaves a token under the current key alone", async () => {
			const current = newKey();
			const token = encryptionServiceFor([current]).encrypt(CONNECT_TOKEN);
			const { service, connectRepository, logger } = await setup([current], [], token);

			const result = await service.run();

			expect(result).toEqual({ scanned: 1, reencrypted: 0, skipped: 0 });
			expect(await storedConnectToken(connectRepository)).toBe(token);
			expect(logger.info).not.toHaveBeenCalledWith("Checkmate Connect token re-encrypted");
		});

		it("does nothing when not enrolled", async () => {
			const { service, connectRepository, logger } = await setup([newKey()], []);

			const result = await service.run();

			expect(result).toEqual({ scanned: 0, reencrypted: 0, skipped: 0 });
			expect((await connectRepository.get()).enrollment).toBeNull();
			expect(logger.warn).not.toHaveBeenCalled();
		});

		it("skips and warns when the token can't be decrypted, keeping it as stored", async () => {
			const previous = newKey();
			const broken = tamperData(encryptionServiceFor([previous]).encrypt(CONNECT_TOKEN));
			const { service, connectRepository, logger } = await setup([newKey(), previous], [], broken);

			const result = await service.run();

			expect(result).toEqual({ scanned: 1, reencrypted: 0, skipped: 1 });
			expect(await storedConnectToken(connectRepository)).toBe(broken);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({ err: expect.objectContaining({ message: "Ciphertext failed authentication" }) }),
				"Could not re-encrypt the Checkmate Connect token"
			);
		});

		it("warns and skips when enrolled without ENCRYPTION_KEY", async () => {
			const token = encryptionServiceFor([newKey()]).encrypt(CONNECT_TOKEN);
			const { service, connectRepository, logger } = await setup([], [], token);

			const result = await service.run();

			expect(result).toEqual({ scanned: 1, reencrypted: 0, skipped: 1 });
			expect(await storedConnectToken(connectRepository)).toBe(token);
			expect(logger.warn).toHaveBeenCalledTimes(1);
			expect(logger.warn).toHaveBeenCalledWith(
				"Checkmate Connect is enrolled but ENCRYPTION_KEY is not set; Connect can't use its credential until it is"
			);
		});

		it("adds the token to the Docker TLS key counts", async () => {
			const current = newKey();
			const previous = newKey();
			const stale = encryptionServiceFor([previous]);
			const rows = [{ id: "m-stale", dockerTlsKey: stale.encrypt(PLAINTEXT) }];
			const { service, logger } = await setup([current, previous], rows, stale.encrypt(CONNECT_TOKEN));

			const result = await service.run();

			expect(result).toEqual({ scanned: 2, reencrypted: 2, skipped: 0 });
			expect(logger.info).toHaveBeenCalledWith({ reencrypted: 1, skipped: 0, scanned: 1 }, "Docker TLS key rotation complete");
		});
	});
});
