import { describe, expect, it, jest } from "@jest/globals";
import { CheckProducer } from "../../../src/worker/worker.check-producer.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		interval: 60000,
		status: "up",
		...overrides,
	}) as Monitor;

// A maintenance window straddling "now" — active per isWindowActive.
const activeWindow = () => {
	const now = Date.now();
	return { active: true, start: new Date(now - 1000).toISOString(), end: new Date(now + 1000).toISOString(), repeat: 0 };
};

const createProducer = (overrides?: Record<string, any>) => {
	const defaults = {
		logger: createMockLogger(),
		monitorsRepository: { updateById: jest.fn().mockResolvedValue({}) },
		maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([]) },
		checkService: { toCheck: jest.fn().mockReturnValue({ id: "check-1" }) },
		networkService: { requestStatus: jest.fn().mockResolvedValue({ monitorId: "m1", status: true, code: 200, message: "OK" }) },
		buffer: { addToBuffer: jest.fn() },
		...overrides,
	};
	const producer = new CheckProducer(
		defaults.monitorsRepository as any,
		defaults.maintenanceWindowsRepository as any,
		defaults.checkService as any,
		defaults.networkService as any,
		defaults.buffer as any,
		defaults.logger as any
	);
	return { producer, defaults };
};

describe("CheckProducer", () => {
	it("throws when monitor id is missing", async () => {
		const { producer } = createProducer();
		await expect(producer.produce({} as Monitor)).rejects.toThrow("No monitor id");
	});

	// ── maintenance gate ──────────────────────────────────────────────────────

	it("skips the check and flips status to 'maintenance' when in a maintenance window", async () => {
		const { producer, defaults } = createProducer({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([activeWindow()]) },
		});

		const result = await producer.produce(makeMonitor({ status: "up" }));

		expect(result).toBeNull();
		expect(defaults.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { status: "maintenance", statusWindow: [] });
		expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
		expect(defaults.buffer.addToBuffer).not.toHaveBeenCalled();
	});

	it("does not re-write status when already in maintenance", async () => {
		const { producer, defaults } = createProducer({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([activeWindow()]) },
		});

		const result = await producer.produce(makeMonitor({ status: "maintenance" }));

		expect(result).toBeNull();
		expect(defaults.monitorsRepository.updateById).not.toHaveBeenCalled();
	});

	it("proceeds with the check when the maintenance window is inactive", async () => {
		const { producer, defaults } = createProducer({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([{ ...activeWindow(), active: false }]) },
		});

		await producer.produce(makeMonitor());

		expect(defaults.networkService.requestStatus).toHaveBeenCalled();
	});

	// ── acquire / record ──────────────────────────────────────────────────────

	it("throws when the network response is null", async () => {
		const { producer } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(null) },
		});

		await expect(producer.produce(makeMonitor())).rejects.toThrow("No network response");
	});

	it("returns null, warns, and does not buffer when toCheck yields nothing", async () => {
		const { producer, defaults } = createProducer({
			checkService: { toCheck: jest.fn().mockReturnValue(null) },
		});

		const result = await producer.produce(makeMonitor());

		expect(result).toBeNull();
		expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No check could be built") }));
		expect(defaults.buffer.addToBuffer).not.toHaveBeenCalled();
	});

	it("buffers the built check and returns the status and check on success", async () => {
		const status = { monitorId: "m1", status: false, code: 500, message: "Error" };
		const check = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(status) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
		});

		const result = await producer.produce(makeMonitor());

		expect(defaults.buffer.addToBuffer).toHaveBeenCalledWith(check);
		expect(result).toEqual({ status, check });
	});
});
