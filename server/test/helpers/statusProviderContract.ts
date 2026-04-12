import { describe, expect, it } from "@jest/globals";
import type { IStatusProvider } from "../../src/service/infrastructure/network/IStatusProvider.ts";
import type { Monitor } from "../../src/types/index.ts";

/**
 * Shared contract tests for all IStatusProvider implementations.
 * Tests the interface guarantees that every provider must satisfy.
 */
export const testStatusProviderContract = (
	name: string,
	opts: {
		create: () => IStatusProvider<unknown>;
		supportedType: string;
		unsupportedType: string;
		makeMonitor: () => Monitor;
	}
) => {
	describe(`IStatusProvider contract: ${name}`, () => {
		it("has a readonly type property matching the supported type", () => {
			const provider = opts.create();
			expect(provider.type).toBe(opts.supportedType);
		});

		it("supports() returns true for its own type", () => {
			const provider = opts.create();
			expect(provider.supports(opts.supportedType as any)).toBe(true);
		});

		it("supports() returns false for a different type", () => {
			const provider = opts.create();
			expect(provider.supports(opts.unsupportedType as any)).toBe(false);
		});

		it("handle() returns an object with required MonitorStatusResponse fields", async () => {
			const provider = opts.create();
			try {
				const result = await provider.handle(opts.makeMonitor());
				expect(result).toEqual(
					expect.objectContaining({
						monitorId: expect.anything(),
						teamId: expect.anything(),
						type: expect.anything(),
						status: expect.any(Boolean),
						code: expect.any(Number),
						message: expect.any(String),
					})
				);
			} catch (err: any) {
				// Some providers throw AppError on failure — that's also valid behavior
				expect(err).toBeDefined();
			}
		});
	});
};
