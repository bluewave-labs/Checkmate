import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectHeartbeatService } from "../../../src/domain/connect/connect-heartbeat.service.ts";
import type { ConnectEnrollment } from "../../../src/domain/connect/connect.type.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { APP_VERSION } from "../../../src/utils/appVersion.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const TOKEN = `cmk_${"a".repeat(48)}`;

const enrollment = (encryptionService: EncryptionService, overrides: Partial<ConnectEnrollment> = {}): ConnectEnrollment => ({
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "agent-1",
	token: encryptionService.encrypt(TOKEN),
	apiUrl: "https://connect.checkmate.so",
	...overrides,
});

const setup = async (opts: { enrolled?: boolean; post?: jest.Mock<any>; token?: string } = {}) => {
	const logger = createMockLogger();
	const encryptionService = new EncryptionService([nodeCrypto.randomBytes(32)], createMockLogger(), nodeCrypto);
	const repository = new InMemoryConnectRepository();
	if (opts.enrolled !== false) {
		await repository.setEnrollment(enrollment(encryptionService, opts.token === undefined ? {} : { token: opts.token }));
	}
	const got = { post: opts.post ?? jest.fn<any>().mockResolvedValue({ statusCode: 200 }) };
	const service = new ConnectHeartbeatService(got as any, repository, encryptionService, logger as any);
	return { service, got, logger };
};

describe("ConnectHeartbeatService.handleJob", () => {
	it("posts the agent id and version to the enrolled host's heartbeat endpoint with the token", async () => {
		const { service, got } = await setup();

		await service.handleJob();

		expect(got.post).toHaveBeenCalledTimes(1);
		const [url, options] = got.post.mock.calls[0] as [string, any];
		expect(url).toBe("https://relay.checkmate.so/api/heartbeat");
		expect(options.json).toEqual({ agentId: "agent-1", agentVersion: APP_VERSION });
		expect(options.headers.authorization).toBe(`Bearer ${TOKEN}`);
		expect(options.headers["user-agent"]).toBe(`Checkmate/${APP_VERSION}`);
		expect(options.retry).toEqual({ limit: 0 });
		expect(options.followRedirect).toBe(false);
		expect(options.timeout).toEqual({ request: 10_000 });
	});

	it("does nothing when not enrolled", async () => {
		const { service, got, logger } = await setup({ enrolled: false });

		await service.handleJob();

		expect(got.post).not.toHaveBeenCalled();
		expect(logger.info).not.toHaveBeenCalled();
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it("doesn't post and warns once when the stored token can't be decrypted", async () => {
		const { service, got, logger } = await setup({ token: "v1.not.a.valid.ciphertext" });

		await service.handleJob();
		await service.handleJob();

		expect(got.post).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalledWith(expect.anything(), "Connect heartbeat paused: the stored credential can't be decrypted");
	});

	it("never throws when the network fails", async () => {
		const { service, logger } = await setup({ post: jest.fn<any>().mockRejectedValue(new Error("ECONNREFUSED")) });

		await expect(service.handleJob()).resolves.toBeUndefined();
		expect(logger.warn).toHaveBeenCalledWith(expect.anything(), "Connect heartbeat unreachable");
	});

	it("never throws when got times out the request", async () => {
		const timeout = Object.assign(new Error("Timeout awaiting 'request' for 10000ms"), { name: "TimeoutError", code: "ETIMEDOUT" });
		const { service, logger } = await setup({ post: jest.fn<any>().mockRejectedValue(timeout) });

		await expect(service.handleJob()).resolves.toBeUndefined();
		expect(logger.warn).toHaveBeenCalledWith({ err: timeout }, "Connect heartbeat unreachable");
	});

	it("warns with the status when the cloud rejects the beat", async () => {
		const { service, logger } = await setup({ post: jest.fn<any>().mockResolvedValue({ statusCode: 401 }) });

		await expect(service.handleJob()).resolves.toBeUndefined();
		expect(logger.warn).toHaveBeenCalledWith({ statusCode: 401 }, "Connect heartbeat rejected (401)");
	});

	it("logs only when the outcome changes", async () => {
		const post = jest
			.fn<any>()
			.mockResolvedValueOnce({ statusCode: 200 })
			.mockResolvedValueOnce({ statusCode: 200 })
			.mockRejectedValueOnce(new Error("ECONNRESET"))
			.mockRejectedValueOnce(new Error("ECONNRESET"))
			.mockResolvedValueOnce({ statusCode: 200 });
		const { service, logger } = await setup({ post });

		for (let i = 0; i < 5; i++) await service.handleJob();

		expect(logger.info).toHaveBeenCalledTimes(2);
		expect(logger.info).toHaveBeenCalledWith("Connect heartbeat reporting");
		expect(logger.warn).toHaveBeenCalledTimes(1);
	});
});
