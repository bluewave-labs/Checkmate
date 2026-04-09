import { describe, expect, it, jest } from "@jest/globals";
import { HardwareProvider } from "../../../src/service/infrastructure/network/HardwareProvider.ts";
import { testStatusProviderContract } from "../../helpers/statusProviderContract.ts";
import type { HttpProvider } from "../../../src/service/infrastructure/network/HttpProvider.ts";
import type { Monitor } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		type: "hardware",
		url: "https://capture.example.com",
		...overrides,
	}) as Monitor;

const createMockHttpProvider = () =>
	({
		handle: jest.fn().mockResolvedValue({
			monitorId: "mon-1",
			teamId: "team-1",
			type: "hardware",
			status: true,
			code: 200,
			message: "OK",
			responseTime: 50,
			payload: { data: { cpu: { usage_percent: 0.5 } } },
		}),
	}) as unknown as jest.Mocked<HttpProvider>;

const createProvider = () => {
	const httpProvider = createMockHttpProvider();
	const provider = new HardwareProvider(httpProvider);
	return { provider, httpProvider };
};

// ── Contract ─────────────────────────────────────────────────────────────────

testStatusProviderContract("HardwareProvider", {
	create: () => createProvider().provider,
	supportedType: "hardware",
	unsupportedType: "http",
	makeMonitor: () => makeMonitor(),
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("HardwareProvider", () => {
	it("delegates to httpProvider.handle", async () => {
		const { provider, httpProvider } = createProvider();
		const monitor = makeMonitor();

		await provider.handle(monitor);

		expect(httpProvider.handle).toHaveBeenCalledWith(monitor);
	});

	it("returns the response from httpProvider", async () => {
		const { provider } = createProvider();
		const result = await provider.handle(makeMonitor());

		expect(result).toEqual(
			expect.objectContaining({
				monitorId: "mon-1",
				status: true,
				code: 200,
			})
		);
	});

	it("throws AppError when url is missing", async () => {
		const { provider } = createProvider();

		await expect(provider.handle(makeMonitor({ url: "" }))).rejects.toThrow("URL is required for Hardware monitor");
	});

	it("throws AppError when httpProvider.handle throws", async () => {
		const { provider, httpProvider } = createProvider();
		(httpProvider.handle as jest.Mock).mockRejectedValue(new Error("connection failed"));

		await expect(provider.handle(makeMonitor())).rejects.toThrow("connection failed");
	});

	it("throws AppError with default message for non-Error thrown values", async () => {
		const { provider, httpProvider } = createProvider();
		(httpProvider.handle as jest.Mock).mockRejectedValue("string error");

		await expect(provider.handle(makeMonitor())).rejects.toThrow("Error performing Hardware request");
	});
});
