import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectApiRejectedError } from "../../../src/domain/connect/connect-api.service.ts";
import type { ConnectEnrollment, ConnectSsoConfig, ConnectSsoState } from "../../../src/domain/connect/connect.type.ts";
import { SsoSyncService } from "../../../src/domain/sso/sso-sync.service.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const TOKEN = `cmk_${"a".repeat(48)}`;
const NOW = new Date("2026-11-27T10:00:00.000Z");

const config: ConnectSsoConfig = {
	enabled: true,
	provider: "entra",
	label: "Sign in with Microsoft",
	enforce: false,
	graceUntil: null,
	startUrl: "https://connect.checkmate.so/sso/start",
};

const cached: ConnectSsoState = { ...config, fetchedAt: "2026-11-27T09:00:00.000Z", lastCheckRunAt: "2026-11-27T09:30:00.000Z" };

const setup = async (opts: { enrolled?: boolean; sso?: ConnectSsoState; ssoConfig?: jest.Mock<any> } = {}) => {
	const logger = createMockLogger();
	const encryptionService = new EncryptionService([nodeCrypto.randomBytes(32)], createMockLogger(), nodeCrypto);
	const connectRepository = new InMemoryConnectRepository();
	if (opts.enrolled !== false) {
		const enrollment: ConnectEnrollment = {
			connectUrl: "wss://relay.checkmate.so/api/tunnel",
			agentId: "agent-1",
			token: encryptionService.encrypt(TOKEN),
			apiUrl: "https://connect.checkmate.so",
		};
		await connectRepository.setEnrollment(enrollment);
	}
	if (opts.sso) await connectRepository.setSsoState(opts.sso);
	const connectApiService = { ssoConfig: opts.ssoConfig ?? jest.fn<any>().mockResolvedValue(config) };
	const service = new SsoSyncService({
		connectRepository,
		connectApiService: connectApiService as any,
		encryptionService,
		logger: logger as any,
		now: () => NOW,
	});
	return { service, connectRepository, connectApiService, logger };
};

describe("SsoSyncService.handleJob", () => {
	it("stores the config from Connect", async () => {
		const { service, connectRepository, connectApiService } = await setup({ sso: cached });

		await service.handleJob();

		expect(connectApiService.ssoConfig).toHaveBeenCalledWith(expect.objectContaining({ agentId: "agent-1", token: TOKEN }));
		expect((await connectRepository.get()).sso).toEqual({ ...config, fetchedAt: NOW.toISOString(), lastCheckRunAt: cached.lastCheckRunAt });
	});

	it("stores a null lastCheckRunAt on the first sync", async () => {
		const { service, connectRepository } = await setup();

		await service.handleJob();

		expect((await connectRepository.get()).sso).toMatchObject({ enabled: true, lastCheckRunAt: null });
	});

	it("keeps the cached config when Connect is unreachable", async () => {
		const { service, connectRepository } = await setup({ sso: cached, ssoConfig: jest.fn<any>().mockRejectedValue(new Error("ECONNREFUSED")) });

		await service.handleJob();

		expect((await connectRepository.get()).sso).toEqual(cached);
	});

	it("keeps the cached config when Connect answers 503 unavailable", async () => {
		const { service, connectRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockRejectedValue(new ConnectApiRejectedError(503, "unavailable")),
		});

		await service.handleJob();

		expect((await connectRepository.get()).sso).toEqual(cached);
	});

	it("stores a disabled config on 401", async () => {
		const { service, connectRepository } = await setup({
			sso: cached,
			ssoConfig: jest.fn<any>().mockRejectedValue(new ConnectApiRejectedError(401, "unauthorized")),
		});

		await service.handleJob();

		expect((await connectRepository.get()).sso).toEqual({
			enabled: false,
			provider: null,
			label: null,
			enforce: false,
			graceUntil: null,
			startUrl: null,
			fetchedAt: NOW.toISOString(),
			lastCheckRunAt: cached.lastCheckRunAt,
		});
	});

	it("clears the SSO state when the instance is not enrolled", async () => {
		const { service, connectRepository, connectApiService } = await setup({ enrolled: false, sso: cached });

		await service.handleJob();

		expect((await connectRepository.get()).sso).toBeNull();
		expect(connectApiService.ssoConfig).not.toHaveBeenCalled();
	});

	it("warns only when the outcome changes", async () => {
		const ssoConfig = jest.fn<any>().mockRejectedValue(new Error("down"));
		const { service, logger } = await setup({ ssoConfig });

		await service.handleJob();
		await service.handleJob();
		expect(logger.warn).toHaveBeenCalledTimes(1);

		ssoConfig.mockResolvedValue(config);
		await service.handleJob();
		await service.handleJob();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.info).toHaveBeenCalledTimes(1);
	});
});
