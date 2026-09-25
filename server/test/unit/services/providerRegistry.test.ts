import { describe, expect, it, jest } from "@jest/globals";
import { ProviderRegistry } from "../../../src/service/networkProviders/providerRegistry.ts";
import { NETWORK_ERROR } from "../../../src/types/network.ts";
import type { IStatusProvider } from "../../../src/service/networkProviders/IStatusProvider.ts";
import type { Monitor, MonitorType } from "../../../src/domain/monitors/monitor.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createMockProvider = (type: string, result?: unknown) => {
	const provider: jest.Mocked<IStatusProvider<unknown>> = {
		type,
		supports: jest.fn((t: MonitorType) => t === type) as any,
		handle: jest.fn().mockResolvedValue(
			result ?? {
				monitorId: "mon-1",
				teamId: "team-1",
				type,
				status: true,
				code: 200,
				message: "OK",
			}
		),
	};
	return provider;
};

const createRegistry = (providers: IStatusProvider<unknown>[] = []) => new ProviderRegistry(providers);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ProviderRegistry", () => {
	describe("probe", () => {
		it("delegates to the matching provider", async () => {
			const provider = createMockProvider("http");
			const registry = createRegistry([provider]);
			const monitor = { type: "http", _id: "mon-1" } as unknown as Monitor & { type: "http" };

			const result = await registry.probe(monitor);

			expect(provider.supports).toHaveBeenCalledWith("http");
			expect(provider.handle).toHaveBeenCalledWith(monitor, undefined);
			expect(result).toEqual(
				expect.objectContaining({
					monitorId: "mon-1",
					status: true,
					code: 200,
				})
			);
		});

		it("selects the correct provider when multiple are registered", async () => {
			const httpProvider = createMockProvider("http");
			const pingProvider = createMockProvider("ping");
			const registry = createRegistry([httpProvider, pingProvider]);
			const monitor = { type: "ping", _id: "mon-2" } as unknown as Monitor & { type: "ping" };

			await registry.probe(monitor);

			expect(httpProvider.handle).not.toHaveBeenCalled();
			expect(pingProvider.handle).toHaveBeenCalledWith(monitor, undefined);
		});

		it("forwards the check context to the provider", async () => {
			const provider = createMockProvider("http");
			const registry = createRegistry([provider]);
			const monitor = { type: "http", _id: "mon-1" } as unknown as Monitor & { type: "http" };
			const ctx = { proxyUrl: "http://proxy.example.com:8080" };

			await registry.probe(monitor, ctx);

			expect(provider.handle).toHaveBeenCalledWith(monitor, ctx);
		});

		it("returns unsupported-type response when no provider matches", async () => {
			const registry = createRegistry([]);
			const monitor = { type: "unknown_type" as any, _id: "mon-1" } as unknown as Monitor & { type: any };

			const result = await registry.probe(monitor);

			expect(result).toEqual({
				monitorId: "unknown",
				teamId: "unknown",
				type: "unknown",
				status: false,
				code: NETWORK_ERROR,
				message: "Unsupported type: unknown_type",
			});
		});
	});
});
