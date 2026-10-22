import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { TelemetryService } from "../../../src/domain/telemetry/telemetry.service.ts";
import { APP_VERSION } from "../../../src/utils/appVersion.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TELEMETRY_URL = "https://telemetry.example.com/v1/heartbeat";

const makeEnv = (overrides?: Record<string, unknown>) => ({
	telemetryEnabled: true,
	telemetryUrl: TELEMETRY_URL,
	queueMode: "primary",
	deployment: "docker",
	...overrides,
});

const MONITOR_TYPE_COUNT = [
	{ type: "http", count: 2 },
	{ type: "ping", count: 0 },
];

const createService = (overrides?: { env?: Record<string, unknown>; instanceId?: string | null; post?: jest.Mock<any> }) => {
	const got = { post: overrides?.post ?? jest.fn<any>().mockResolvedValue({ statusCode: 200 }) };
	const settingsService = { getSettings: jest.fn<any>().mockReturnValue(makeEnv(overrides?.env)) };
	const settingsRepository = {
		findOrCreateTelemetryInstanceId: jest.fn<any>().mockResolvedValue(overrides?.instanceId === undefined ? "instance-1" : overrides.instanceId),
	};
	const monitorsRepository = { findMonitorTypeCount: jest.fn<any>().mockResolvedValue(MONITOR_TYPE_COUNT) };
	const logger = createMockLogger();
	const service = new TelemetryService(got as any, settingsService as any, settingsRepository as any, monitorsRepository as any, logger as any);
	return { service, got, settingsService, settingsRepository, monitorsRepository, logger };
};

describe("TelemetryService", () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	describe("buildPayload", () => {
		it("contains exactly the documented anonymous fields", async () => {
			const { service } = createService();

			const payload = await service.buildPayload();

			expect(Object.keys(payload!).sort()).toEqual([
				"arch",
				"deployment",
				"instanceId",
				"monitorTypeCount",
				"nodeVersion",
				"os",
				"queueMode",
				"version",
			]);
			expect(payload).toEqual({
				instanceId: "instance-1",
				version: APP_VERSION,
				deployment: "docker",
				queueMode: "primary",
				nodeVersion: process.versions.node,
				os: process.platform,
				arch: process.arch,
				monitorTypeCount: MONITOR_TYPE_COUNT,
			});
		});

		it("returns null when no instance id is available", async () => {
			const { service } = createService({ instanceId: null });

			expect(await service.buildPayload()).toBeNull();
		});
	});

	describe("handleJob", () => {
		it("posts the payload to the configured url with a versioned user agent and no retries", async () => {
			const { service, got } = createService();

			await service.handleJob();

			expect(got.post).toHaveBeenCalledTimes(1);
			const [url, options] = got.post.mock.calls[0] as [string, any];
			expect(url).toBe(TELEMETRY_URL);
			expect(options.json.instanceId).toBe("instance-1");
			expect(options.headers["user-agent"]).toBe(`Checkmate/${APP_VERSION}`);
			expect(options.retry).toEqual({ limit: 0 });
		});

		it("does nothing when telemetry is disabled", async () => {
			const { service, got, settingsRepository } = createService({ env: { telemetryEnabled: false } });

			await service.handleJob();

			expect(settingsRepository.findOrCreateTelemetryInstanceId).not.toHaveBeenCalled();
			expect(got.post).not.toHaveBeenCalled();
		});

		it("does not post when no instance id is available", async () => {
			const { service, got } = createService({ instanceId: null });

			await service.handleJob();

			expect(got.post).not.toHaveBeenCalled();
		});

		it("swallows a failed request and logs it at debug", async () => {
			const { service, logger } = createService({ post: jest.fn<any>().mockRejectedValue(new Error("ECONNREFUSED")) });

			await expect(service.handleJob()).resolves.toBeUndefined();

			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), "Telemetry heartbeat failed");
		});

		it("swallows a repository failure", async () => {
			const { service, settingsRepository, got } = createService();
			settingsRepository.findOrCreateTelemetryInstanceId.mockRejectedValue(new Error("db down"));

			await expect(service.handleJob()).resolves.toBeUndefined();

			expect(got.post).not.toHaveBeenCalled();
		});

		it("gives up after the timeout when the receiver never answers", async () => {
			jest.useFakeTimers();
			const { service, logger } = createService({ post: jest.fn<any>(() => new Promise(() => {})) });

			const pending = service.handleJob();
			await jest.advanceTimersByTimeAsync(5000);

			await expect(pending).resolves.toBeUndefined();
			expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), "Telemetry heartbeat failed");
		});
	});
});
