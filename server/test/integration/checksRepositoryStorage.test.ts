import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoChecksRepository from "../../src/domain/checks/check.repository.mongo.ts";
import { CheckModel } from "../../src/domain/checks/check.model.ts";
import type { CheckDrive } from "../../src/domain/checks/check.type.ts";
import type { ILogger } from "../../src/utils/logger.ts";
import { createMockLogger } from "../helpers/createMockLogger.ts";

// ── Real-Mongo harness ─────────────────────────────────────────────────────────
// Storage health relies on what only the database can show: null counters staying null ("not reported" is not 0),
// an empty raid list staying distinct from no raid at all, $elemMatch on the drives array of a time-series
// collection, and $max/$avg skipping nulls when bucketing drive history.

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await CheckModel.createCollection(); // timeseries collections must exist before insert
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await CheckModel.deleteMany({});
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONITOR_ID = new mongoose.Types.ObjectId();
const OTHER_MONITOR_ID = new mongoose.Types.ObjectId();
const TEAM_ID = new mongoose.Types.ObjectId();
const HOUR_MS = 60 * 60 * 1000;

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);

// Two whole hours back, at the start of the hour, so offsets below stay inside one "day" range bucket
const hourStart = (() => {
	const date = new Date(Date.now() - 3 * HOUR_MS);
	date.setUTCMinutes(0, 0, 0);
	return date;
})();
const inHour = (hourOffset: number, minute: number) => new Date(hourStart.getTime() + hourOffset * HOUR_MS + minute * 60 * 1000);

const makeDrive = (overrides?: Partial<CheckDrive>): CheckDrive => ({
	device: "/dev/sdb",
	type: "sat",
	protocol: "ATA",
	status: "ok",
	model_name: "WDC WD40EFRX-68N32N0",
	serial_number: "WD-WCC7K1PL4R2X",
	firmware_version: "82.00A82",
	capacity_bytes: 4000787030016,
	warnings: [],
	reallocated_sectors: 0,
	pending_sectors: 0,
	offline_uncorrectable: 0,
	media_errors: null,
	smart_overall_health_self_assessment_test_result: "PASSED",
	temperature: "38 Celsius",
	power_on_hours: "41882",
	power_cycles: "87",
	unsafe_shutdowns: "41",
	percentage_used: "",
	available_spare: "",
	available_spare_threshold: "",
	critical_warning: "",
	data_units_read: "",
	data_units_written: "",
	host_read_commands: "",
	host_write_commands: "",
	controller_busy_time: "",
	...overrides,
});

const asleep = (device: string) => ({ device, type: "", protocol: "", status: "standby", serial_number: "", model_name: "", warnings: [] });

const raidArray = {
	device: "/dev/md127",
	level: "raid1",
	state: "clean",
	raid_disks: 2,
	degraded_disks: 1,
	sync_action: "recover",
	sync_progress: 0.42,
	members: [
		{ device: "/dev/sda2", state: "in_sync" },
		{ device: "/dev/sdb2", state: "faulty,blocked" },
	],
};

const seedCheck = (createdAt: Date, overrides: Record<string, unknown> = {}, monitorId = MONITOR_ID) =>
	CheckModel.create({
		metadata: { monitorId, teamId: TEAM_ID, type: "hardware" },
		status: true,
		responseTime: 100,
		createdAt,
		...overrides,
	});

const createRepo = () => new MongoChecksRepository(createMockLogger() as unknown as ILogger);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MongoChecksRepository storage health", () => {
	describe("storing raid and drives", () => {
		it("keeps null counters as null rather than 0", async () => {
			await seedCheck(minutesAgo(1), { drives: [makeDrive({ reallocated_sectors: null, media_errors: null, capacity_bytes: null })] });

			const latest = await createRepo().findLatestDrives(MONITOR_ID.toHexString());

			expect(latest!.drives[0].reallocated_sectors).toBeNull();
			expect(latest!.drives[0].media_errors).toBeNull();
			expect(latest!.drives[0].capacity_bytes).toBeNull();
			expect(latest!.drives[0].pending_sectors).toBe(0);
		});

		it("does not store raid or drives on checks that did not carry them", async () => {
			await seedCheck(minutesAgo(1));

			const doc = await CheckModel.findOne({ "metadata.monitorId": MONITOR_ID }).lean();

			expect(doc).not.toHaveProperty("raid");
			expect(doc).not.toHaveProperty("drives");
		});

		it("rejects a drive status outside the closed set", async () => {
			await expect(seedCheck(minutesAgo(1), { drives: [makeDrive({ status: "sleeping" as CheckDrive["status"] })] })).rejects.toThrow();
		});
	});

	describe("findLatestRaid", () => {
		it("returns the arrays of the most recent check that reported raid", async () => {
			await seedCheck(minutesAgo(5), { raid: [{ ...raidArray, degraded_disks: 0, state: "clean" }] });
			await seedCheck(minutesAgo(2), { raid: [raidArray] });
			await seedCheck(minutesAgo(1)); // a check without raid, e.g. Capture briefly unreachable

			const latest = await createRepo().findLatestRaid(MONITOR_ID.toHexString());

			expect(latest!.arrays).toEqual([raidArray]);
			expect(new Date(latest!.checkedAt).getTime()).toBeLessThan(minutesAgo(1).getTime());
		});

		it("returns an empty list for a host without arrays", async () => {
			await seedCheck(minutesAgo(1), { raid: [] });

			const latest = await createRepo().findLatestRaid(MONITOR_ID.toHexString());

			expect(latest!.arrays).toEqual([]);
		});

		it("returns null when no recent check reported raid (Capture without RAID support)", async () => {
			await seedCheck(minutesAgo(1));
			await seedCheck(new Date(Date.now() - 25 * HOUR_MS), { raid: [raidArray] }); // outside the lookback

			expect(await createRepo().findLatestRaid(MONITOR_ID.toHexString())).toBeNull();
		});

		it("ignores other monitors", async () => {
			await seedCheck(minutesAgo(1), { raid: [raidArray] }, OTHER_MONITOR_ID);

			expect(await createRepo().findLatestRaid(MONITOR_ID.toHexString())).toBeNull();
		});
	});

	describe("findLatestDrives", () => {
		it("returns the latest SMART fetch with that check's errors", async () => {
			await seedCheck(minutesAgo(15), { drives: [makeDrive({ reallocated_sectors: 1 })] });
			await seedCheck(minutesAgo(5), {
				drives: [],
				errors: [{ metric: ["smartctl"], err: "smartctl is not installed" }],
			});
			await seedCheck(minutesAgo(1)); // between SMART fetches

			const latest = await createRepo().findLatestDrives(MONITOR_ID.toHexString());

			expect(latest!.drives).toEqual([]);
			expect(latest!.errors).toEqual([{ metric: ["smartctl"], err: "smartctl is not installed" }]);
		});

		it("returns null when SMART was never fetched", async () => {
			await seedCheck(minutesAgo(1));

			expect(await createRepo().findLatestDrives(MONITOR_ID.toHexString())).toBeNull();
		});
	});

	describe("findLastKnownDrive", () => {
		it("returns the device's most recent reading that had a serial", async () => {
			await seedCheck(minutesAgo(60 * 48), { drives: [makeDrive({ device: "/dev/sdc", serial_number: "OLD", reallocated_sectors: 1 })] });
			await seedCheck(minutesAgo(60 * 30), { drives: [makeDrive({ device: "/dev/sdc", serial_number: "ZL2ABC", reallocated_sectors: 3 })] });
			await seedCheck(minutesAgo(10), { drives: [makeDrive(), asleep("/dev/sdc")] });

			const lastKnown = await createRepo().findLastKnownDrive(MONITOR_ID.toHexString(), "/dev/sdc");

			expect(lastKnown!.drive).toMatchObject({ device: "/dev/sdc", serial_number: "ZL2ABC", reallocated_sectors: 3 });
			expect(new Date(lastKnown!.checkedAt).getTime()).toBeLessThan(minutesAgo(60 * 29).getTime());
		});

		it("returns null for a device only ever seen asleep", async () => {
			await seedCheck(minutesAgo(10), { drives: [asleep("/dev/sdd")] });

			expect(await createRepo().findLastKnownDrive(MONITOR_ID.toHexString(), "/dev/sdd")).toBeNull();
		});
	});

	describe("findDriveHistory", () => {
		it("buckets each serial's readings, taking the counter maximum and average temperature", async () => {
			await seedCheck(inHour(0, 5), { drives: [makeDrive({ reallocated_sectors: 180, temperature: "36 Celsius" })] });
			await seedCheck(inHour(0, 15), { drives: [makeDrive({ reallocated_sectors: 184, temperature: "40 Celsius" })] });
			await seedCheck(inHour(1, 5), { drives: [makeDrive({ reallocated_sectors: 190, temperature: "41 Celsius" })] });

			const history = await createRepo().findDriveHistory(MONITOR_ID.toHexString(), "day");

			expect(history).toHaveLength(1);
			expect(history[0].serial_number).toBe("WD-WCC7K1PL4R2X");
			expect(history[0].points).toEqual([
				{
					bucketDate: inHour(0, 0).toISOString().replace(".000Z", "Z"),
					reallocated_sectors: 184,
					pending_sectors: 0,
					offline_uncorrectable: 0,
					media_errors: null,
					temperature: 38,
				},
				{
					bucketDate: inHour(1, 0).toISOString().replace(".000Z", "Z"),
					reallocated_sectors: 190,
					pending_sectors: 0,
					offline_uncorrectable: 0,
					media_errors: null,
					temperature: 41,
				},
			]);
		});

		it("keeps drives apart by serial even when their device path changes", async () => {
			await seedCheck(inHour(0, 5), {
				drives: [makeDrive({ device: "/dev/sdb", serial_number: "A" }), makeDrive({ device: "/dev/sdc", serial_number: "B" })],
			});
			await seedCheck(inHour(1, 5), {
				drives: [makeDrive({ device: "/dev/sdc", serial_number: "A" }), makeDrive({ device: "/dev/sdb", serial_number: "B" })],
			});

			const history = await createRepo().findDriveHistory(MONITOR_ID.toHexString(), "day");

			expect(history.map((series) => [series.serial_number, series.points.length])).toEqual([
				["A", 2],
				["B", 2],
			]);
		});

		it("skips standby, unsupported and error entries, and reads a missing temperature as null", async () => {
			await seedCheck(inHour(0, 5), {
				drives: [makeDrive({ temperature: "" }), asleep("/dev/sdc"), makeDrive({ device: "/dev/vda", status: "unsupported", serial_number: "" })],
			});

			const history = await createRepo().findDriveHistory(MONITOR_ID.toHexString(), "day");

			expect(history).toHaveLength(1);
			expect(history[0].points[0].temperature).toBeNull();
		});

		it("returns no series when SMART was never fetched", async () => {
			await seedCheck(inHour(0, 5));

			expect(await createRepo().findDriveHistory(MONITOR_ID.toHexString(), "day")).toEqual([]);
		});
	});
});
