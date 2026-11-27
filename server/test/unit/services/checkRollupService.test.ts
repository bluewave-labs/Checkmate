import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { CheckRollupService } from "../../../src/domain/check-rollups/check-rollup.service.ts";

const NOW = new Date("2026-03-10T10:07:30.000Z");
const CURRENT_BUCKET_START = "2026-03-10T10:00:00.000Z";

const setup = (options: { latest?: Date; oldest?: Date; checkTTL?: number; monitors?: { id: string; type: string; interval: number }[] } = {}) => {
	jest.useFakeTimers();
	jest.setSystemTime(NOW);
	const checkRollupsRepository = {
		rollUp: jest.fn<any>().mockResolvedValue(undefined),
		findLatestBucketStart: jest.fn<any>().mockResolvedValue(options.latest ?? null),
	};
	const checksRepository = {
		findOldestCreatedAt: jest.fn<any>().mockResolvedValue(options.oldest ?? null),
	};
	const settingsService = {
		getDBSettings: jest.fn<any>().mockResolvedValue({ checkTTL: options.checkTTL ?? 30 }),
	};
	const monitorsRepository = {
		findAllForScheduling: jest.fn<any>().mockResolvedValue(options.monitors ?? []),
	};
	const service = new CheckRollupService(checkRollupsRepository as any, checksRepository as any, settingsService as any, monitorsRepository as any);
	const windows = () => checkRollupsRepository.rollUp.mock.calls.map(([from, to]: Date[]) => [from?.toISOString(), to?.toISOString()]);
	return { service, checkRollupsRepository, checksRepository, windows };
};

afterEach(() => {
	jest.useRealTimers();
});

describe("CheckRollupService.rollUpClosedBuckets", () => {
	it("does nothing when there are no rollups and no checks", async () => {
		const { service, checkRollupsRepository } = setup();

		await service.rollUpClosedBuckets();

		expect(checkRollupsRepository.rollUp).not.toHaveBeenCalled();
	});

	it("backfills from the oldest check's bucket in 24-hour chunks up to the open bucket", async () => {
		const { service, windows } = setup({ oldest: new Date("2026-03-08T09:20:00.000Z") });

		await service.rollUpClosedBuckets();

		expect(windows()).toEqual([
			["2026-03-08T09:15:00.000Z", "2026-03-09T09:15:00.000Z"],
			["2026-03-09T09:15:00.000Z", "2026-03-10T09:15:00.000Z"],
			["2026-03-10T09:15:00.000Z", CURRENT_BUCKET_START],
		]);
	});

	it("re-rolls the two hours before the latest bucket on a normal run", async () => {
		const { service, checksRepository, windows } = setup({ latest: new Date("2026-03-10T09:45:00.000Z") });

		await service.rollUpClosedBuckets();

		expect(windows()).toEqual([["2026-03-10T07:45:00.000Z", CURRENT_BUCKET_START]]);
		expect(checksRepository.findOldestCreatedAt).not.toHaveBeenCalled();
	});

	it("catches up in chunks after downtime", async () => {
		const { service, windows } = setup({ latest: new Date("2026-03-08T12:00:00.000Z") });

		await service.rollUpClosedBuckets();

		expect(windows()).toEqual([
			["2026-03-08T10:00:00.000Z", "2026-03-09T10:00:00.000Z"],
			["2026-03-09T10:00:00.000Z", CURRENT_BUCKET_START],
		]);
	});

	it("does not roll buckets within the margin of the retention boundary", async () => {
		const { service, windows } = setup({ oldest: new Date("2026-03-05T00:00:00.000Z"), checkTTL: 1 });

		await service.rollUpClosedBuckets();

		expect(windows()).toEqual([["2026-03-09T12:15:00.000Z", CURRENT_BUCKET_START]]);
	});

	it("applies no retention boundary when retention is unlimited", async () => {
		const { service, windows } = setup({ oldest: new Date("2025-01-01T00:00:00.000Z"), checkTTL: 366 });

		await service.rollUpClosedBuckets();

		expect(windows()[0]?.[0]).toBe("2025-01-01T00:00:00.000Z");
	});

	it("does nothing when the only checks are in the open bucket", async () => {
		const { service, checkRollupsRepository } = setup({ oldest: new Date("2026-03-10T10:03:00.000Z") });

		await service.rollUpClosedBuckets();

		expect(checkRollupsRepository.rollUp).not.toHaveBeenCalled();
	});

	it("passes the interval of every hardware monitor to each chunk", async () => {
		const { service, checkRollupsRepository } = setup({
			oldest: new Date("2026-03-08T09:20:00.000Z"),
			monitors: [
				{ id: "hardware-1", type: "hardware", interval: 60000 },
				{ id: "http-1", type: "http", interval: 30000 },
				{ id: "hardware-2", type: "hardware", interval: 300000 },
			],
		});

		await service.rollUpClosedBuckets();

		const intervals = checkRollupsRepository.rollUp.mock.calls.map((call: unknown[]) => call[2]);
		expect(intervals.length).toBeGreaterThan(1);
		for (const passed of intervals) {
			expect(passed).toEqual([
				{ monitorId: "hardware-1", intervalMs: 60000 },
				{ monitorId: "hardware-2", intervalMs: 300000 },
			]);
		}
	});
});
