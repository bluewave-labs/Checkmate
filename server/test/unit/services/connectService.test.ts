import { describe, expect, it } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectService, isConnectHostAllowed } from "../../../src/domain/connect/connect.service.ts";
import { connectErrors } from "../../../src/domain/connect/connect.errors.ts";
import { DEFAULT_CONNECT_HOSTS, type ConnectEnrollment } from "../../../src/domain/connect/connect.type.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import type { ILogger } from "../../../src/utils/logger/logger.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const VERSION = "1.2.3";

const enrollment = (overrides: Partial<ConnectEnrollment> = {}): ConnectEnrollment => ({
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "agent-1",
	token: `cmk_${"a".repeat(48)}`,
	apiUrl: "https://connect.checkmate.so",
	...overrides,
});

const setup = (opts: { encryptionKey?: boolean; allowedHosts?: readonly string[] } = {}) => {
	const logger = createMockLogger() as unknown as ILogger;
	const keys = opts.encryptionKey === false ? [] : [nodeCrypto.randomBytes(32)];
	const encryptionService = new EncryptionService(keys, logger, nodeCrypto);
	const repository = new InMemoryConnectRepository();
	const service = new ConnectService(repository, encryptionService, logger, {
		allowedHosts: opts.allowedHosts ?? DEFAULT_CONNECT_HOSTS,
		version: VERSION,
	});
	return { service, repository, encryptionService };
};

const expectAppError = async (promise: Promise<unknown>, definition: { status: number; description: string }) => {
	const error = await promise.catch((caught: unknown) => caught);
	expect(error).toBeInstanceOf(AppError);
	expect((error as AppError).definition).toBe(definition);
};

describe("isConnectHostAllowed", () => {
	it("accepts the official hosts", () => {
		expect(isConnectHostAllowed("wss://relay.checkmate.so/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(true);
		expect(isConnectHostAllowed("https://connect.checkmate.so", DEFAULT_CONNECT_HOSTS)).toBe(true);
	});

	it("rejects other hosts and lookalikes", () => {
		expect(isConnectHostAllowed("wss://evil.example/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(false);
		expect(isConnectHostAllowed("wss://relay.checkmate.so.evil.com/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(false);
		expect(isConnectHostAllowed("wss://evilrelay.checkmate.so/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(false);
	});

	it("matches subdomains only for an entry starting with a dot", () => {
		const allowed = [".example.com"];
		expect(isConnectHostAllowed("https://a.example.com", allowed)).toBe(true);
		expect(isConnectHostAllowed("https://example.com", allowed)).toBe(false);
		expect(isConnectHostAllowed("https://badexample.com", allowed)).toBe(false);
	});

	it("rejects a URL that can't be parsed", () => {
		expect(isConnectHostAllowed("not a url", DEFAULT_CONNECT_HOSTS)).toBe(false);
	});
});

describe("ConnectService.getStatus", () => {
	it("reports not enrolled when the installation never enrolled", async () => {
		const { service } = setup();

		await expect(service.getStatus()).resolves.toEqual({
			enrolled: false,
			agentId: null,
			connectUrl: null,
			apiUrl: null,
			agentVersion: VERSION,
		});
	});
});

describe("ConnectService.enroll", () => {
	it("stores the enrollment with the token encrypted and returns the status without it", async () => {
		const { service, repository, encryptionService } = setup();
		const input = enrollment();

		const status = await service.enroll(input);

		expect(status).toEqual({
			enrolled: true,
			agentId: input.agentId,
			connectUrl: input.connectUrl,
			apiUrl: input.apiUrl,
			agentVersion: VERSION,
		});
		expect(JSON.stringify(status)).not.toContain(input.token);
		const stored = (await repository.get()).enrollment;
		expect(stored?.token).not.toBe(input.token);
		expect(encryptionService.decrypt(stored?.token ?? "")).toBe(input.token);
	});

	it("accepts an enrollment without an API URL", async () => {
		const { service } = setup();

		const status = await service.enroll(enrollment({ apiUrl: null }));

		expect(status.enrolled).toBe(true);
		expect(status.apiUrl).toBeNull();
	});

	it("refuses a tunnel host that isn't allowed, without saving", async () => {
		const { service, repository } = setup();

		await expectAppError(service.enroll(enrollment({ connectUrl: "wss://evil.example/api/tunnel" })), connectErrors.hostNotAllowed);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("refuses an API host that isn't allowed, without saving", async () => {
		const { service, repository } = setup();

		await expectAppError(service.enroll(enrollment({ apiUrl: "https://evil.example" })), connectErrors.hostNotAllowed);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("accepts a host added to the allowlist", async () => {
		const { service } = setup({ allowedHosts: [".connect.example"] });

		const status = await service.enroll(enrollment({ connectUrl: "wss://relay.connect.example/api/tunnel", apiUrl: "https://api.connect.example" }));

		expect(status.enrolled).toBe(true);
	});

	it("refuses without ENCRYPTION_KEY, without saving", async () => {
		const { service, repository } = setup({ encryptionKey: false });

		await expectAppError(service.enroll(enrollment()), connectErrors.encryptionKeyMissing);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("replaces an existing enrollment", async () => {
		const { service } = setup();
		await service.enroll(enrollment());

		const status = await service.enroll(enrollment({ agentId: "agent-2" }));

		expect(status.agentId).toBe("agent-2");
	});
});

describe("ConnectService.unenroll", () => {
	it("clears the enrollment", async () => {
		const { service, repository } = setup();
		await service.enroll(enrollment());

		const status = await service.unenroll();

		expect(status.enrolled).toBe(false);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("succeeds when never enrolled", async () => {
		const { service } = setup();

		await expect(service.unenroll()).resolves.toMatchObject({ enrolled: false });
	});

	it("works when the stored token can't be decrypted", async () => {
		const { service, repository } = setup();
		await repository.setEnrollment({ ...enrollment(), token: "v1.not.a.valid.ciphertext" });

		await expect(service.getStatus()).resolves.toMatchObject({ enrolled: true });
		await expect(service.unenroll()).resolves.toMatchObject({ enrolled: false });
	});
});
