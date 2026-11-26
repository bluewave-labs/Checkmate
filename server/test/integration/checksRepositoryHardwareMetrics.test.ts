import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { Check } from "../../src/domain/checks/check.type.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await CheckModel.deleteMany({});
});

const MONITOR_ID = new mongoose.Types.ObjectId();
const OTHER_MONITOR_ID = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();
const MINUTE_MS = 60 * 1000;
const INTERVAL_MS = MINUTE_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;

const noonUtcDaysAgo = (days: number) => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - days);
	date.setUTCHours(12, 0, 0, 0);
	return date.getTime();
};
const utcDay = (ms: number) => `${new Date(ms).toISOString().slice(0, 10)}T00:00:00Z`;

const YESTERDAY = noonUtcDaysAgo(1);
const TWO_DAYS_AGO = noonUtcDaysAgo(2);

const makeCheck = (
	createdAtMs: number,
	overrides: Partial<Check> = {},
	monitorId = MONITOR_ID,
	type: Check["metadata"]["type"] = "hardware"
): Check => {
	const createdAt = new Date(createdAtMs).toISOString();
	return {
		id: new mongoose.Types.ObjectId().toString(),
		metadata: { monitorId: monitorId.toString(), teamId: TEAM_ID.toString(), type },
		status: true,
		statusCode: 200,
		responseTime: 1000,
		message: "OK",
		createdAt,
		updatedAt: createdAt,
		...overrides,
	};
};

const reading = (cpuUsage: number, memoryUsage: number, temperature: number[] | null = [40, 50]) => ({
	cpu: { physical_core: 4, logical_core: 8, frequency: 4800, current_frequency: 4000 + cpuUsage * 1000, temperature, usage_percent: cpuUsage },
	memory: { total_bytes: 1000, available_bytes: 1000 - memoryUsage * 1000, used_bytes: memoryUsage * 1000, usage_percent: memoryUsage },
});

const failed = { status: false, statusCode: 5000, message: "connect ECONNREFUSED" };

const disk = (device: string, mountpoint: string, values: Record<string, number | null> = {}) => ({
	device,
	mountpoint,
	total_bytes: 1000,
	free_bytes: 700,
	used_bytes: 300,
	usage_percent: 0.3,
	total_inodes: 100,
	free_inodes: 90,
	used_inodes: 10,
	inodes_usage_percent: 0.1,
	read_bytes: 0,
	write_bytes: 0,
	read_time: 0,
	write_time: 0,
	...values,
});

const iface = (name: string, values: Record<string, number> = {}) => ({
	name,
	bytes_sent: 0,
	bytes_recv: 0,
	packets_sent: 0,
	packets_recv: 0,
	err_in: 0,
	err_out: 0,
	drop_in: 0,
	drop_out: 0,
	fifo_in: 0,
	fifo_out: 0,
	...values,
});

const raidArray = (device: string, values: Record<string, unknown> = {}) => ({
	device,
	level: "raid1",
	state: "clean",
	raid_disks: 2,
	degraded_disks: 0,
	sync_action: "idle",
	sync_progress: null,
	members: [
		{ device: "/dev/sda1", state: "in_sync" },
		{ device: "/dev/sdb1", state: "in_sync" },
	],
	...values,
});

const ROOT = ["/dev/sda1", "/"] as const;
const DATA = ["/dev/sdb1", "/data"] as const;

const setup = () => new MongoChecksRepository(createMockLogger() as unknown as ILogger);

describe("MongoChecksRepository.findHardwareMetrics", () => {
	it("returns an empty result for a monitor with no checks", async () => {
		const repo = setup();

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result).toEqual({ checks: { total: 0, up: 0 }, latest: null, buckets: [], disks: [], interfaces: [], raid: [] });
	});

	it("averages each level per bucket, in bucket order", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.2, 0.4)),
			makeCheck(YESTERDAY + MINUTE_MS, reading(0.4, 0.6)),
			makeCheck(TWO_DAYS_AGO, reading(0.8, 0.1)),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result.buckets).toEqual([
			{
				bucketDate: utcDay(TWO_DAYS_AGO),
				cpu: { usage: 0.8, currentFrequency: 4800, temperature: [40, 50] },
				memory: { usedBytes: 100, availableBytes: 900, usage: 0.1 },
			},
			{
				bucketDate: utcDay(YESTERDAY),
				cpu: { usage: expect.closeTo(0.3, 10), currentFrequency: 4300, temperature: [40, 50] },
				memory: { usedBytes: 500, availableBytes: 500, usage: 0.5 },
			},
		]);
	});

	it("counts failed checks and leaves them out of the averages", async () => {
		const repo = setup();
		await repo.createChecks([makeCheck(YESTERDAY, reading(0.5, 0.4)), makeCheck(YESTERDAY + MINUTE_MS, failed)]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result.checks).toEqual({ total: 2, up: 1 });
		expect(result.buckets).toHaveLength(1);
		expect(result.buckets[0]?.cpu.usage).toBe(0.5);
		expect(result.buckets[0]?.memory.usage).toBe(0.4);
	});

	it("leaves null readings out of the averages", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.5, 0.4)),
			makeCheck(YESTERDAY + MINUTE_MS, {
				cpu: { usage_percent: null, current_frequency: null, temperature: null },
				memory: { usage_percent: null, used_bytes: null, available_bytes: null },
			}),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result.buckets).toEqual([
			{
				bucketDate: utcDay(YESTERDAY),
				cpu: { usage: 0.5, currentFrequency: 4500, temperature: [40, 50] },
				memory: { usedBytes: 400, availableBytes: 600, usage: 0.4 },
			},
		]);
	});

	it("returns a bucket of nulls when no check in it has a reading", async () => {
		const repo = setup();
		await repo.createChecks([makeCheck(YESTERDAY, failed)]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result.buckets).toEqual([
			{
				bucketDate: utcDay(YESTERDAY),
				cpu: { usage: null, currentFrequency: null, temperature: [] },
				memory: { usedBytes: null, availableBytes: null, usage: null },
			},
		]);
	});

	it("averages temperature per sensor position when the number of sensors changes", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.5, 0.4, [40, 50, 60])),
			makeCheck(YESTERDAY + MINUTE_MS, reading(0.5, 0.4, [60])),
			makeCheck(YESTERDAY + 2 * MINUTE_MS, reading(0.5, 0.4, null)),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result.buckets[0]?.cpu.temperature).toEqual([50, 50, 60]);
	});

	it("returns the newest successful check as latest, whatever the range", async () => {
		const repo = setup();
		const errors = [{ metric: ["cpu.temperature"], err: "no sensors" }];
		const takenAt = Date.now() - 40 * DAY_MS;
		await repo.createChecks([
			makeCheck(takenAt, {
				...reading(0.25, 0.75, null),
				host: { os: "linux", platform: "ubuntu", kernel_version: "7.0.0", pretty_name: null },
				capture: { version: "2.0.1", mode: "release" },
				errors,
			}),
			makeCheck(takenAt + DAY_MS, failed),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "day", INTERVAL_MS);

		expect(result.buckets).toEqual([]);
		expect(result.checks).toEqual({ total: 0, up: 0 });
		expect(result.latest).toEqual({
			checkedAt: new Date(takenAt).toISOString(),
			host: { os: "linux", platform: "ubuntu", kernelVersion: "7.0.0", prettyName: null },
			capture: { version: "2.0.1", mode: "release" },
			cpu: { physicalCore: 4, logicalCore: 8, frequency: 4800, currentFrequency: 4250, usage: 0.25, temperature: null },
			memory: { totalBytes: 1000, usedBytes: 750, availableBytes: 250, usage: 0.75 },
			errors,
		});
	});

	it("reads only hardware checks of the requested monitor", async () => {
		const repo = setup();
		await repo.createChecks([
			makeCheck(YESTERDAY, reading(0.5, 0.4)),
			makeCheck(YESTERDAY, reading(0.9, 0.9), OTHER_MONITOR_ID),
			makeCheck(YESTERDAY, {}, MONITOR_ID, "http"),
		]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result.checks).toEqual({ total: 1, up: 1 });
		expect(result.buckets[0]?.cpu.usage).toBe(0.5);
	});

	it("leaves out checks taken while egress was degraded", async () => {
		const repo = setup();
		await repo.createChecks([makeCheck(YESTERDAY, reading(0.5, 0.4)), makeCheck(YESTERDAY + MINUTE_MS, { ...failed, egressStatus: "degraded" })]);

		const result = await repo.findHardwareMetrics(MONITOR_ID.toString(), "month", INTERVAL_MS);

		expect(result.checks).toEqual({ total: 1, up: 1 });
	});

	describe("disks", () => {
		const findDisks = async (dateRange: "day" | "month" = "month") => {
			const result = await setup().findHardwareMetrics(MONITOR_ID.toString(), dateRange, INTERVAL_MS);
			return result.disks;
		};

		it("averages each disk's levels per bucket, matching disks by device and mountpoint", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { disk: [disk(...ROOT, { usage_percent: 0.2, used_bytes: 200 }), disk(...DATA, { usage_percent: 0.8 })] }),
				makeCheck(YESTERDAY + MINUTE_MS, { disk: [disk(...DATA, { usage_percent: 0.6 }), disk(...ROOT, { usage_percent: 0.4, used_bytes: 400 })] }),
			]);

			const disks = await findDisks();

			expect(disks.map((entry) => [entry.device, entry.mountpoint])).toEqual([ROOT, DATA].map((key) => [...key]));
			expect(disks[0]?.buckets).toHaveLength(1);
			expect(disks[0]?.buckets[0]).toMatchObject({
				bucketDate: utcDay(YESTERDAY),
				usage: expect.closeTo(0.3, 10),
				usedBytes: 300,
				freeBytes: 700,
				usedInodes: 10,
				freeInodes: 90,
				inodesUsage: 0.1,
			});
			expect(disks[1]?.buckets[0]?.usage).toBeCloseTo(0.7, 10);
		});

		it("turns counters into rates from the change between consecutive checks", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { disk: [disk(...ROOT, { read_bytes: 1000, write_bytes: 5000, read_time: 100, write_time: 0 })] }),
				makeCheck(YESTERDAY + MINUTE_MS, { disk: [disk(...ROOT, { read_bytes: 1600, write_bytes: 5000, read_time: 700, write_time: 60000 })] }),
				makeCheck(YESTERDAY + 2 * MINUTE_MS, { disk: [disk(...ROOT, { read_bytes: 2800, write_bytes: 6200, read_time: 1300, write_time: 120000 })] }),
			]);

			const [root] = await findDisks();

			expect(root?.buckets[0]).toMatchObject({
				readBytesPerSecond: 15,
				writeBytesPerSecond: 10,
				readTimeFraction: 0.01,
				writeTimeFraction: 1,
			});
		});

		it("counts the new value, not a negative change, when a counter resets", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { disk: [disk(...ROOT, { read_bytes: 900000 })] }),
				makeCheck(YESTERDAY + MINUTE_MS, { disk: [disk(...ROOT, { read_bytes: 300 })] }),
			]);

			const [root] = await findDisks();

			expect(root?.buckets[0]?.readBytesPerSecond).toBe(5);
		});

		it("bridges one failed check between two readings", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { disk: [disk(...ROOT, { read_bytes: 0 })] }),
				makeCheck(YESTERDAY + MINUTE_MS, failed),
				makeCheck(YESTERDAY + 2 * MINUTE_MS, { disk: [disk(...ROOT, { read_bytes: 1200 })] }),
			]);

			const [root] = await findDisks();

			expect(root?.buckets[0]?.readBytesPerSecond).toBe(10);
		});

		it("gives no rate across a gap of more than three intervals", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { disk: [disk(...ROOT, { read_bytes: 0 })] }),
				makeCheck(YESTERDAY + 4 * MINUTE_MS, { disk: [disk(...ROOT, { read_bytes: 99999 })] }),
			]);

			const [root] = await findDisks();

			expect(root?.buckets[0]?.readBytesPerSecond).toBeNull();
			expect(root?.buckets[0]?.usage).toBe(0.3);
		});

		it("gives no rate when the agent reported no I/O values", async () => {
			const noIo = { read_bytes: null, write_bytes: null, read_time: null, write_time: null };
			await setup().createChecks([
				makeCheck(YESTERDAY, { disk: [disk(...ROOT, noIo)] }),
				makeCheck(YESTERDAY + MINUTE_MS, { disk: [disk(...ROOT, noIo)] }),
			]);

			const [root] = await findDisks();

			expect(root?.buckets[0]).toMatchObject({
				readBytesPerSecond: null,
				writeBytesPerSecond: null,
				readTimeFraction: null,
				writeTimeFraction: null,
				usage: 0.3,
			});
		});

		it("pairs the first check in the range with the one just before it, without charting that earlier check", async () => {
			const rangeStart = Date.now() - 24 * 60 * MINUTE_MS;
			await setup().createChecks([
				makeCheck(rangeStart - 30 * 1000, { disk: [disk(...ROOT, { read_bytes: 0, usage_percent: 0.9 })] }),
				makeCheck(rangeStart + 30 * 1000, { disk: [disk(...ROOT, { read_bytes: 600, usage_percent: 0.1 })] }),
			]);

			const [root] = await findDisks("day");

			expect(root?.buckets).toHaveLength(1);
			expect(root?.buckets[0]?.readBytesPerSecond).toBe(10);
			expect(root?.buckets[0]?.usage).toBe(0.1);
		});

		it("attaches the latest check's values, and lists a disk that only one of range or latest has", async () => {
			await setup().createChecks([
				makeCheck(TWO_DAYS_AGO, { disk: [disk(...ROOT), disk(...DATA)] }),
				makeCheck(YESTERDAY, { disk: [disk(...ROOT, { total_bytes: 2000, used_bytes: 500, usage_percent: 0.25, total_inodes: null })] }),
			]);

			const disks = await findDisks();

			expect(disks).toHaveLength(2);
			expect(disks[0]).toMatchObject({
				device: ROOT[0],
				mountpoint: ROOT[1],
				latest: {
					totalBytes: 2000,
					usedBytes: 500,
					freeBytes: 700,
					usage: 0.25,
					totalInodes: null,
					usedInodes: 10,
					freeInodes: 90,
					inodesUsage: 0.1,
				},
			});
			expect(disks[0]?.buckets).toHaveLength(2);
			expect(disks[1]).toMatchObject({ device: DATA[0], mountpoint: DATA[1], latest: null });
			expect(disks[1]?.buckets).toHaveLength(1);
		});

		it("lists the latest check's disks with no buckets when the range has no checks", async () => {
			await setup().createChecks([makeCheck(Date.now() - 40 * DAY_MS, { disk: [disk(...ROOT)] })]);

			const disks = await findDisks("day");

			expect(disks).toHaveLength(1);
			expect(disks[0]).toMatchObject({ device: ROOT[0], mountpoint: ROOT[1], buckets: [] });
			expect(disks[0]?.latest?.usage).toBe(0.3);
		});
	});

	describe("interfaces", () => {
		const findInterfaces = async (dateRange: "day" | "month" = "month") => {
			const result = await setup().findHardwareMetrics(MONITOR_ID.toString(), dateRange, INTERVAL_MS);
			return result.interfaces;
		};

		it("turns byte and packet counters into rates, matching interfaces by name", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { net: [iface("eth0", { bytes_sent: 1000, bytes_recv: 0, packets_sent: 10, packets_recv: 0 }), iface("lo")] }),
				makeCheck(YESTERDAY + MINUTE_MS, {
					net: [iface("lo", { bytes_sent: 60 }), iface("eth0", { bytes_sent: 1600, bytes_recv: 1200, packets_sent: 70, packets_recv: 120 })],
				}),
			]);

			const interfaces = await findInterfaces();

			expect(interfaces.map((entry) => entry.name)).toEqual(["eth0", "lo"]);
			expect(interfaces[0]?.buckets).toEqual([
				{
					bucketDate: utcDay(YESTERDAY),
					bytesSentPerSecond: 10,
					bytesRecvPerSecond: 20,
					packetsSentPerSecond: 1,
					packetsRecvPerSecond: 2,
					errIn: 0,
					errOut: 0,
					dropIn: 0,
					dropOut: 0,
					fifoIn: 0,
					fifoOut: 0,
				},
			]);
			expect(interfaces[1]?.buckets[0]?.bytesSentPerSecond).toBe(1);
		});

		it("counts errors and drops per bucket, not per second", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { net: [iface("eth0", { err_in: 5, err_out: 1, drop_in: 0, drop_out: 2, fifo_in: 7, fifo_out: 0 })] }),
				makeCheck(YESTERDAY + MINUTE_MS, { net: [iface("eth0", { err_in: 8, err_out: 1, drop_in: 4, drop_out: 2, fifo_in: 9, fifo_out: 6 })] }),
				makeCheck(YESTERDAY + 2 * MINUTE_MS, { net: [iface("eth0", { err_in: 9, err_out: 1, drop_in: 4, drop_out: 3, fifo_in: 9, fifo_out: 6 })] }),
			]);

			const [eth0] = await findInterfaces();

			expect(eth0?.buckets[0]).toMatchObject({ errIn: 4, errOut: 0, dropIn: 4, dropOut: 1, fifoIn: 2, fifoOut: 6 });
		});

		it("counts the new value when a counter resets", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { net: [iface("eth0", { bytes_sent: 900000, err_in: 50 })] }),
				makeCheck(YESTERDAY + MINUTE_MS, { net: [iface("eth0", { bytes_sent: 600, err_in: 2 })] }),
			]);

			const [eth0] = await findInterfaces();

			expect(eth0?.buckets[0]?.bytesSentPerSecond).toBe(10);
			expect(eth0?.buckets[0]?.errIn).toBe(2);
		});

		it("gives null, not zero, across a gap of more than three intervals", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { net: [iface("eth0", { bytes_sent: 0, err_in: 0 })] }),
				makeCheck(YESTERDAY + 4 * MINUTE_MS, { net: [iface("eth0", { bytes_sent: 99999, err_in: 9 })] }),
			]);

			const [eth0] = await findInterfaces();

			expect(eth0?.buckets[0]?.bytesSentPerSecond).toBeNull();
			expect(eth0?.buckets[0]?.errIn).toBeNull();
		});

		it("bridges a check that has no interface list", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { net: [iface("eth0", { bytes_sent: 0 })] }),
				makeCheck(YESTERDAY + MINUTE_MS, reading(0.5, 0.4)),
				makeCheck(YESTERDAY + 2 * MINUTE_MS, { net: [iface("eth0", { bytes_sent: 1200 })] }),
			]);

			const [eth0] = await findInterfaces();

			expect(eth0?.buckets[0]?.bytesSentPerSecond).toBe(10);
		});

		it("pairs the first check in the range with the one just before it", async () => {
			const rangeStart = Date.now() - 24 * 60 * MINUTE_MS;
			await setup().createChecks([
				makeCheck(rangeStart - 30 * 1000, { net: [iface("eth0", { bytes_sent: 0 })] }),
				makeCheck(rangeStart + 30 * 1000, { net: [iface("eth0", { bytes_sent: 600 })] }),
			]);

			const [eth0] = await findInterfaces("day");

			expect(eth0?.buckets).toHaveLength(1);
			expect(eth0?.buckets[0]?.bytesSentPerSecond).toBe(10);
		});

		it("lists the latest check's interfaces with no buckets when the range has no checks", async () => {
			await setup().createChecks([makeCheck(Date.now() - 40 * DAY_MS, { net: [iface("lo"), iface("eth0")] })]);

			const interfaces = await findInterfaces("day");

			expect(interfaces).toEqual([
				{ name: "eth0", buckets: [] },
				{ name: "lo", buckets: [] },
			]);
		});
	});

	describe("raid", () => {
		const findRaid = async (dateRange: "day" | "month" = "month") => {
			const result = await setup().findHardwareMetrics(MONITOR_ID.toString(), dateRange, INTERVAL_MS);
			return result.raid;
		};

		it("returns no arrays for a host that reports none", async () => {
			await setup().createChecks([makeCheck(YESTERDAY, { ...reading(0.5, 0.4), raid: [] })]);

			await expect(findRaid()).resolves.toEqual([]);
		});

		it("collects the states and sync actions seen in a bucket and the highest degraded count", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { raid: [raidArray("/dev/md0")] }),
				makeCheck(YESTERDAY + MINUTE_MS, {
					raid: [raidArray("/dev/md0", { state: "active", degraded_disks: 1, sync_action: "recover", sync_progress: 0.25 })],
				}),
				makeCheck(YESTERDAY + 2 * MINUTE_MS, {
					raid: [raidArray("/dev/md0", { state: "active", degraded_disks: 1, sync_action: "recover", sync_progress: 0.5 })],
				}),
				makeCheck(TWO_DAYS_AGO, { raid: [raidArray("/dev/md0")] }),
			]);

			const [md0] = await findRaid();

			expect(md0?.buckets).toEqual([
				{ bucketDate: utcDay(TWO_DAYS_AGO), states: ["clean"], syncActions: ["idle"], maxDegradedDisks: 0 },
				{ bucketDate: utcDay(YESTERDAY), states: ["active", "clean"], syncActions: ["idle", "recover"], maxDegradedDisks: 1 },
			]);
		});

		it("keeps arrays apart by device", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { raid: [raidArray("/dev/md1", { state: "inactive" }), raidArray("/dev/md0")] }),
				makeCheck(YESTERDAY + MINUTE_MS, { raid: [raidArray("/dev/md0"), raidArray("/dev/md1", { state: "inactive" })] }),
			]);

			const arrays = await findRaid();

			expect(arrays.map((array) => [array.device, array.buckets[0]?.states])).toEqual([
				["/dev/md0", ["clean"]],
				["/dev/md1", ["inactive"]],
			]);
		});

		it("leaves null sync actions and degraded counts out, as for a level without redundancy", async () => {
			await setup().createChecks([
				makeCheck(YESTERDAY, { raid: [raidArray("/dev/md2", { level: "raid0", degraded_disks: null, sync_action: null })] }),
			]);

			const [md2] = await findRaid();

			expect(md2?.buckets).toEqual([{ bucketDate: utcDay(YESTERDAY), states: ["clean"], syncActions: [], maxDegradedDisks: null }]);
		});

		it("attaches the latest check's values and members", async () => {
			await setup().createChecks([
				makeCheck(TWO_DAYS_AGO, { raid: [raidArray("/dev/md0"), raidArray("/dev/md9")] }),
				makeCheck(YESTERDAY, {
					raid: [
						raidArray("/dev/md0", {
							state: "active",
							degraded_disks: 1,
							sync_action: "recover",
							sync_progress: 0.25,
							members: [
								{ device: "/dev/sda1", state: "in_sync" },
								{ device: "/dev/sdc1", state: "spare" },
							],
						}),
					],
				}),
			]);

			const arrays = await findRaid();

			expect(arrays).toHaveLength(2);
			expect(arrays[0]?.latest).toEqual({
				level: "raid1",
				state: "active",
				raidDisks: 2,
				degradedDisks: 1,
				syncAction: "recover",
				syncProgress: 0.25,
				members: [
					{ device: "/dev/sda1", state: "in_sync" },
					{ device: "/dev/sdc1", state: "spare" },
				],
			});
			expect(arrays[1]).toMatchObject({ device: "/dev/md9", latest: null });
			expect(arrays[1]?.buckets).toHaveLength(1);
		});

		it("lists the latest check's arrays with no buckets when the range has no checks", async () => {
			await setup().createChecks([makeCheck(Date.now() - 40 * DAY_MS, { raid: [raidArray("/dev/md0")] })]);

			const arrays = await findRaid("day");

			expect(arrays).toHaveLength(1);
			expect(arrays[0]).toMatchObject({ device: "/dev/md0", buckets: [] });
			expect(arrays[0]?.latest?.state).toBe("clean");
		});
	});
});
