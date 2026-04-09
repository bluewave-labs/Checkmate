import { describe, expect, it, jest } from "@jest/globals";
import { PageSpeedProvider } from "../../../src/service/infrastructure/network/PageSpeedProvider.ts";
import { testStatusProviderContract } from "../../helpers/statusProviderContract.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { HttpProvider } from "../../../src/service/infrastructure/network/HttpProvider.ts";
import type { ISettingsService } from "../../../src/service/system/settingsService.ts";
import type { Monitor } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "pagespeed",
		url: "https://example.com",
		...overrides,
	}) as Monitor;

const createMockHttpProvider = () =>
	({
		handle: jest.fn().mockResolvedValue({
			monitorId: "mon-1",
			teamId: "team-1",
			type: "pagespeed",
			status: true,
			code: 200,
			message: "OK",
			responseTime: 2000,
			payload: { lighthouseResult: {} },
		}),
	}) as unknown as jest.Mocked<HttpProvider>;

const createMockSettingsService = (apiKey?: string) =>
	({
		getDBSettings: jest.fn().mockResolvedValue({ pagespeedApiKey: apiKey }),
	}) as unknown as jest.Mocked<ISettingsService>;

const createProvider = (opts?: { apiKey?: string }) => {
	const logger = createMockLogger();
	const httpProvider = createMockHttpProvider();
	const settingsService = createMockSettingsService(opts?.apiKey);
	const provider = new PageSpeedProvider(httpProvider, settingsService, logger as any);
	return { provider, httpProvider, settingsService, logger };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("PageSpeedProvider", {
	create: () => createProvider({ apiKey: "test-key" }).provider,
	supportedType: "pagespeed",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PageSpeedProvider", () => {
	it("delegates to httpProvider with PageSpeed API URL", async () => {
		const { provider, httpProvider } = createProvider({ apiKey: "my-key" });

		await provider.handle(makeMonitor({ url: "https://example.com" }));

		expect(httpProvider.handle).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining("pagespeedonline.googleapis.com"),
			})
		);
	});

	it("includes API key in URL when available", async () => {
		const { provider, httpProvider } = createProvider({ apiKey: "my-key" });

		await provider.handle(makeMonitor());

		const calledUrl = (httpProvider.handle as jest.Mock).mock.calls[0][0].url;
		expect(calledUrl).toContain("key=my-key");
	});

	it("omits API key and logs warning when not configured", async () => {
		const { provider, httpProvider, logger } = createProvider({ apiKey: undefined });

		await provider.handle(makeMonitor());

		const calledUrl = (httpProvider.handle as jest.Mock).mock.calls[0][0].url;
		expect(calledUrl).not.toContain("key=");
		expect(logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				message: expect.stringContaining("API key not found"),
				service: "PageSpeedProvider",
			})
		);
	});

	it("encodes the monitor URL in the PageSpeed API URL", async () => {
		const { provider, httpProvider } = createProvider({ apiKey: "key" });

		await provider.handle(makeMonitor({ url: "https://example.com/path?q=1" }));

		const calledUrl = (httpProvider.handle as jest.Mock).mock.calls[0][0].url;
		expect(calledUrl).toContain(encodeURIComponent("https://example.com/path?q=1"));
	});

	it("includes all PageSpeed categories in the URL", async () => {
		const { provider, httpProvider } = createProvider({ apiKey: "key" });

		await provider.handle(makeMonitor());

		const calledUrl = (httpProvider.handle as jest.Mock).mock.calls[0][0].url;
		expect(calledUrl).toContain("category=seo");
		expect(calledUrl).toContain("category=accessibility");
		expect(calledUrl).toContain("category=best-practices");
		expect(calledUrl).toContain("category=performance");
	});

	it("passes all monitor properties through to httpProvider", async () => {
		const { provider, httpProvider } = createProvider({ apiKey: "key" });
		const monitor = makeMonitor({ id: "mon-5", teamId: "team-9" });

		await provider.handle(monitor);

		expect(httpProvider.handle).toHaveBeenCalledWith(expect.objectContaining({ id: "mon-5", teamId: "team-9" }));
	});

	it("throws AppError when url is missing", async () => {
		const { provider } = createProvider();

		await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("URL is required for PageSpeed monitor");
	});

	it("throws AppError when httpProvider.handle throws", async () => {
		const { provider, httpProvider } = createProvider({ apiKey: "key" });
		(httpProvider.handle as jest.Mock).mockRejectedValue(new Error("timeout"));

		await expect(provider.handle(makeMonitor())).rejects.toThrow("timeout");
	});

	it("throws AppError with default message for non-Error thrown values", async () => {
		const { provider, httpProvider } = createProvider({ apiKey: "key" });
		(httpProvider.handle as jest.Mock).mockRejectedValue("string error");

		await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing PageSpeed request");
	});

	it("handles null apiKey from DB settings", async () => {
		const { provider, logger } = createProvider({ apiKey: null as any });

		await provider.handle(makeMonitor());

		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("API key not found") }));
	});

	it("handles null dbSettings response", async () => {
		const logger = createMockLogger();
		const httpProvider = createMockHttpProvider();
		const settingsService = {
			getDBSettings: jest.fn().mockResolvedValue(null),
		} as unknown as jest.Mocked<ISettingsService>;
		const provider = new PageSpeedProvider(httpProvider, settingsService, logger as any);

		await provider.handle(makeMonitor());

		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("API key not found") }));
	});
});
