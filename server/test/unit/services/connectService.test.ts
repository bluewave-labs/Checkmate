import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectService, isConnectHostAllowed } from "../../../src/domain/connect/connect.service.ts";
import { connectErrors } from "../../../src/domain/connect/connect.errors.ts";
import { DEFAULT_CONNECT_HOSTS, type ConnectEnrollment } from "../../../src/domain/connect/connect.type.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import type { IConnectTunnel } from "../../../src/domain/connect/connect-tunnel.ts";
import { APP_VERSION } from "../../../src/utils/appVersion.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import type { ILogger } from "../../../src/utils/logger/logger.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const enrollment = (overrides: Partial<ConnectEnrollment> = {}): ConnectEnrollment => ({
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "agent-1",
	token: `cmk_${"a".repeat(48)}`,
	apiUrl: "https://connect.checkmate.so",
	...overrides,
});

const TUNNEL_STATUS = { connected: false, lastConnectedAt: null, lastError: null, closeCode: null };

const setup = (opts: { encryptionKey?: boolean; allowedHosts?: readonly string[] } = {}) => {
	const logger = createMockLogger();
	const keys = opts.encryptionKey === false ? [] : [nodeCrypto.randomBytes(32)];
	const encryptionService = new EncryptionService(keys, logger as unknown as ILogger, nodeCrypto);
	const repository = new InMemoryConnectRepository();
	const settingsService = {
		getSettings: () => ({ connectAllowedHosts: [...(opts.allowedHosts ?? DEFAULT_CONNECT_HOSTS)] }),
	} as unknown as ISettingsService;
	const tunnel = { start: jest.fn(), stop: jest.fn(), status: jest.fn(() => ({ ...TUNNEL_STATUS })) };
	const service = new ConnectService(
		repository,
		encryptionService,
		settingsService,
		tunnel as unknown as IConnectTunnel,
		logger as unknown as ILogger
	);
	return { service, repository, encryptionService, tunnel, logger };
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
			agentVersion: APP_VERSION,
			remoteAccess: { enabled: false },
			tunnel: TUNNEL_STATUS,
		});
	});

	it("includes the tunnel's own status", async () => {
		const { service, tunnel } = setup();
		const live = { connected: true, lastConnectedAt: "2026-11-10T16:00:00.000Z", lastError: null, closeCode: null };
		tunnel.status.mockReturnValue(live);

		await expect(service.getStatus()).resolves.toMatchObject({ tunnel: live });
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
			agentVersion: APP_VERSION,
			remoteAccess: { enabled: false },
			tunnel: TUNNEL_STATUS,
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

	it("leaves the tunnel stopped when remote access is off", async () => {
		const { service, tunnel } = setup();

		await service.enroll(enrollment());

		expect(tunnel.start).not.toHaveBeenCalled();
		expect(tunnel.stop).toHaveBeenCalled();
	});

	it("restarts the tunnel with the new credential when remote access is on", async () => {
		const { service, tunnel } = setup();
		await service.enroll(enrollment());
		await service.setRemoteAccess(true);
		tunnel.start.mockClear();
		const newToken = `cmk_${"b".repeat(48)}`;

		await service.enroll(enrollment({ agentId: "agent-2", token: newToken }));

		expect(tunnel.start).toHaveBeenCalledTimes(1);
		expect(tunnel.start).toHaveBeenCalledWith(expect.objectContaining({ agentId: "agent-2", token: newToken }));
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

	it("stops the tunnel and turns remote access off", async () => {
		const { service, repository, tunnel } = setup();
		await service.enroll(enrollment());
		await service.setRemoteAccess(true);
		tunnel.stop.mockClear();

		const status = await service.unenroll();

		expect(tunnel.stop).toHaveBeenCalledTimes(1);
		expect(status.remoteAccess.enabled).toBe(false);
		expect((await repository.get()).remoteAccessEnabled).toBe(false);
	});
});

describe("ConnectService.setRemoteAccess", () => {
	it("turns remote access on and starts the tunnel with the decrypted token", async () => {
		const { service, repository, tunnel } = setup();
		const input = enrollment();
		await service.enroll(input);

		const status = await service.setRemoteAccess(true);

		expect(status.remoteAccess.enabled).toBe(true);
		expect((await repository.get()).remoteAccessEnabled).toBe(true);
		expect(tunnel.start).toHaveBeenCalledWith({ ...input });
	});

	it("turns remote access off and stops the tunnel", async () => {
		const { service, repository, tunnel } = setup();
		await service.enroll(enrollment());
		await service.setRemoteAccess(true);
		tunnel.stop.mockClear();

		const status = await service.setRemoteAccess(false);

		expect(status.remoteAccess.enabled).toBe(false);
		expect((await repository.get()).remoteAccessEnabled).toBe(false);
		expect(tunnel.stop).toHaveBeenCalledTimes(1);
	});

	it("refuses to turn it on when not enrolled, without saving or starting", async () => {
		const { service, repository, tunnel } = setup();

		await expectAppError(service.setRemoteAccess(true), connectErrors.notEnrolled);

		expect((await repository.get()).remoteAccessEnabled).toBe(false);
		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("refuses to turn it on when the stored token can't be decrypted, without saving", async () => {
		const { service, repository, tunnel } = setup();
		await repository.setEnrollment({ ...enrollment(), token: "v1.not.a.valid.ciphertext" });

		await expectAppError(service.setRemoteAccess(true), connectErrors.stateUnavailable);

		expect((await repository.get()).remoteAccessEnabled).toBe(false);
		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("turns it off when not enrolled without error", async () => {
		const { service, tunnel } = setup();

		await expect(service.setRemoteAccess(false)).resolves.toMatchObject({ remoteAccess: { enabled: false } });
		expect(tunnel.stop).toHaveBeenCalled();
	});
});

describe("ConnectService.start", () => {
	it("starts the tunnel with the decrypted token when enrolled with remote access on", async () => {
		const { service, repository, encryptionService, tunnel } = setup();
		const input = enrollment();
		await repository.setEnrollment({ ...input, token: encryptionService.encrypt(input.token) });
		await repository.setRemoteAccess(true);

		await service.start();

		expect(tunnel.start).toHaveBeenCalledTimes(1);
		expect(tunnel.start).toHaveBeenCalledWith({ ...input });
	});

	it("doesn't start the tunnel when remote access is off", async () => {
		const { service, repository, encryptionService, tunnel } = setup();
		await repository.setEnrollment({ ...enrollment(), token: encryptionService.encrypt(enrollment().token) });

		await service.start();

		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("doesn't start the tunnel when not enrolled", async () => {
		const { service, tunnel } = setup();

		await service.start();

		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("logs and doesn't throw when the stored token can't be decrypted", async () => {
		const { service, repository, tunnel, logger } = setup();
		await repository.setEnrollment({ ...enrollment(), token: "v1.not.a.valid.ciphertext" });
		await repository.setRemoteAccess(true);

		await expect(service.start()).resolves.toBeUndefined();

		expect(tunnel.start).not.toHaveBeenCalled();
		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(AppError) }), "Connect could not start remote access");
	});

	it("logs and doesn't throw when the state can't be read", async () => {
		const { service, repository, logger } = setup();
		const failure = new Error("connection refused");
		jest.spyOn(repository, "get").mockRejectedValue(failure);

		await expect(service.start()).resolves.toBeUndefined();

		expect(logger.error).toHaveBeenCalledWith({ err: failure }, "Connect could not start remote access");
	});
});

describe("ConnectService.stop", () => {
	it("stops the tunnel", () => {
		const { service, tunnel } = setup();

		service.stop();

		expect(tunnel.stop).toHaveBeenCalledTimes(1);
	});
});
