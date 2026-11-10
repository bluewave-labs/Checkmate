import { describe, expect, it, jest } from "@jest/globals";
import { HardwareProvider } from "../../../../src/service/networkProviders/HardwareProvider.ts";
import { testStatusProviderContract } from "../../../helpers/statusProviderContract.ts";
import type { HttpProvider } from "../../../../src/service/networkProviders/HttpProvider.ts";
import type { Monitor } from "../../../../src/domain/monitors/monitor.type.ts";
import type { HardwareStatusPayload } from "../../../../src/types/network.ts";

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

		expect(httpProvider.handle).toHaveBeenCalledTimes(1);
		expect(httpProvider.handle).toHaveBeenCalledWith(monitor, undefined);
	});

	it("forwards the check context to the metrics request", async () => {
		const { provider, httpProvider } = createProvider();
		const monitor = makeMonitor();

		await provider.handle(monitor, { proxyUrl: "http://proxy:8080" });

		expect(httpProvider.handle).toHaveBeenCalledWith(monitor, { proxyUrl: "http://proxy:8080" });
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

	describe("SMART", () => {
		const METRICS_URL = "https://capture.example.com/api/v1/metrics";
		const SMART_URL = "https://capture.example.com/api/v1/metrics/smart";

		const metricsResponse = (overrides?: Record<string, unknown>) => ({
			monitorId: "mon-1",
			teamId: "team-1",
			type: "hardware",
			status: true,
			code: 200,
			message: "OK",
			responseTime: 50,
			payload: { data: { cpu: { usage_percent: 0.5 } } },
			...overrides,
		});

		const smartResponse = (overrides?: Record<string, unknown>) => ({
			...metricsResponse(),
			payload: { data: [{ device: "/dev/sda", status: "ok", serial_number: "S1" }], errors: [] },
			...overrides,
		});

		// Answers the metrics and SMART URLs separately, as Capture does
		const setup = (smart: () => Promise<unknown>, metrics: () => Promise<unknown> = async () => metricsResponse()) => {
			const httpProvider = {
				handle: jest.fn((monitor: Monitor) => (monitor.url === SMART_URL ? smart() : metrics())),
			} as unknown as jest.Mocked<HttpProvider>;
			const provider = new HardwareProvider(httpProvider);
			const monitor = makeMonitor({
				url: METRICS_URL,
				useAdvancedMatching: true,
				jsonPath: "data.cpu",
				customUpCodes: [503],
			} as Partial<Monitor>);
			return { provider, httpProvider, monitor };
		};

		it("does not fetch SMART when the pipeline did not ask for it", async () => {
			const { provider, httpProvider, monitor } = setup(async () => smartResponse());

			const result = await provider.handle(monitor);

			expect(httpProvider.handle).toHaveBeenCalledTimes(1);
			expect((result.payload as HardwareStatusPayload).smart).toBeUndefined();
		});

		it("fetches SMART with a plain GET, the maximum timeout when no interval is set, and no retry", async () => {
			const { provider, httpProvider, monitor } = setup(async () => smartResponse());
			const ctx = { smartUrl: SMART_URL };

			await provider.handle(monitor, ctx);

			const smartCall = (httpProvider.handle as jest.Mock).mock.calls.find(([m]) => (m as Monitor).url === SMART_URL)!;
			expect(smartCall[0]).toEqual(
				expect.objectContaining({ url: SMART_URL, method: "GET", useAdvancedMatching: false, jsonPath: undefined, customUpCodes: [] })
			);
			expect(smartCall[1]).toBe(ctx);
			expect(smartCall[2]).toEqual({ timeoutMs: 60_000, retryLimit: 0 });
		});

		it("caps the SMART timeout at half the check interval", async () => {
			const { provider, httpProvider, monitor } = setup(async () => smartResponse());

			await provider.handle({ ...monitor, interval: 15_000 }, { smartUrl: SMART_URL });

			const smartCall = (httpProvider.handle as jest.Mock).mock.calls.find(([m]) => (m as Monitor).url === SMART_URL)!;
			expect(smartCall[2]).toEqual({ timeoutMs: 7_500, retryLimit: 0 });
		});

		it("attaches the drives and SMART errors to the hardware payload", async () => {
			const errors = [{ metric: ["smartctl"], err: "smartctl failed for /dev/sdb: permission denied (try running as root)" }];
			const { provider, monitor } = setup(async () =>
				smartResponse({ payload: { data: [{ device: "/dev/sda", status: "ok", serial_number: "S1" }], errors } })
			);

			const result = await provider.handle(monitor, { smartUrl: SMART_URL });

			expect((result.payload as HardwareStatusPayload).smart).toEqual({
				drives: [{ device: "/dev/sda", status: "ok", serial_number: "S1" }],
				errors,
			});
		});

		it("records a failed SMART request as an error without changing the monitor's status", async () => {
			const { provider, monitor } = setup(async () =>
				smartResponse({ status: false, code: 5000, message: "Timeout awaiting 'request' for 60000ms", payload: null })
			);

			const result = await provider.handle(monitor, { smartUrl: SMART_URL });

			expect(result.status).toBe(true);
			expect(result.code).toBe(200);
			expect((result.payload as HardwareStatusPayload).smart).toEqual({
				errors: [{ metric: ["smart"], err: "SMART request failed: Timeout awaiting 'request' for 60000ms" }],
			});
		});

		it("records a thrown SMART request as an error without failing the check", async () => {
			const { provider, monitor } = setup(async () => {
				throw new Error("socket hang up");
			});

			const result = await provider.handle(monitor, { smartUrl: SMART_URL });

			expect(result.status).toBe(true);
			expect((result.payload as HardwareStatusPayload).smart).toEqual({
				errors: [{ metric: ["smart"], err: "SMART request failed: socket hang up" }],
			});
		});

		it("records a non-JSON SMART response as an error", async () => {
			const { provider, monitor } = setup(async () => smartResponse({ payload: "<html>" }));

			const result = await provider.handle(monitor, { smartUrl: SMART_URL });

			expect((result.payload as HardwareStatusPayload).smart).toEqual({
				errors: [{ metric: ["smart"], err: "SMART request failed: response is not JSON" }],
			});
		});

		it("skips SMART from a Capture that returns a single object (no per-drive support)", async () => {
			const { provider, monitor } = setup(async () => smartResponse({ payload: { data: { temperature: "38 Celsius" }, errors: [] } }));

			const result = await provider.handle(monitor, { smartUrl: SMART_URL });

			expect(result.status).toBe(true);
			expect((result.payload as HardwareStatusPayload).smart).toBeUndefined();
		});

		it("leaves a failed metrics check as it is when SMART succeeds", async () => {
			const { provider, monitor } = setup(
				async () => smartResponse(),
				async () => metricsResponse({ status: false, code: 5000, message: "ECONNREFUSED", payload: null })
			);

			const result = await provider.handle(monitor, { smartUrl: SMART_URL });

			expect(result.status).toBe(false);
			expect(result.payload).toBeNull();
		});
	});
});
