import { describe, expect, it } from "@jest/globals";
import {
	describeStorageBreach,
	findOpenedStorageBreaches,
	findStorageBreaches,
	nextStorageBreaches,
	type StorageBreach,
} from "../../../src/domain/storage/storage-alert.ts";
import type { CheckDrive, CheckRaidArray } from "../../../src/domain/checks/check.type.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";

const makeArray = (overrides?: Partial<CheckRaidArray>): CheckRaidArray => ({
	device: "/dev/md1",
	level: "raid1",
	state: "clean",
	raid_disks: 2,
	degraded_disks: 0,
	sync_action: "idle",
	sync_progress: null,
	members: [
		{ device: "/dev/sda2", state: "in_sync" },
		{ device: "/dev/sdb2", state: "in_sync" },
	],
	...overrides,
});

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

// Standby, unsupported and error entries carry no identity or values
const makeUnreadDrive = (status: CheckDrive["status"], device = "/dev/sdb"): CheckDrive =>
	makeDrive({
		device,
		status,
		serial_number: "",
		model_name: "",
		smart_overall_health_self_assessment_test_result: "",
		pending_sectors: null,
		offline_uncorrectable: null,
	});

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		type: "hardware",
		storageAlertOnArrayDegraded: true,
		storageAlertOnDriveFailure: true,
		storageAlertOnDriveWarning: true,
		...overrides,
	}) as Monitor;

const failedDriveBreach: StorageBreach = {
	subject: "WD-WCC7K1PL4R2X",
	reason: "drive_failed",
	detail: "health FAILED",
	device: "/dev/sdb",
	model: "WDC WD40EFRX-68N32N0",
};

const degradedArrayBreach: StorageBreach = { subject: "/dev/md1", reason: "array_degraded", detail: "degraded, 1 of 2 disks missing" };

describe("findStorageBreaches", () => {
	describe("array_degraded", () => {
		it("reports an array with missing disks", () => {
			expect(findStorageBreaches(makeMonitor(), [makeArray({ degraded_disks: 1 })], undefined)).toEqual([degradedArrayBreach]);
		});

		it("does not report a healthy array", () => {
			expect(findStorageBreaches(makeMonitor(), [makeArray()], undefined)).toEqual([]);
		});

		it("does not report an array without redundancy (null degraded_disks)", () => {
			expect(findStorageBreaches(makeMonitor(), [makeArray({ level: "raid0", degraded_disks: null })], undefined)).toEqual([]);
		});

		it("does not report a rebuilding array whose disks are all present", () => {
			const rebuilding = makeArray({ degraded_disks: 0, sync_action: "recover", sync_progress: 0.42 });
			expect(findStorageBreaches(makeMonitor(), [rebuilding], undefined)).toEqual([]);
		});

		it("omits the total when raid_disks is unknown", () => {
			const [breach] = findStorageBreaches(makeMonitor(), [makeArray({ degraded_disks: 1, raid_disks: null })], undefined);
			expect(breach.detail).toBe("degraded, 1 disk(s) missing");
		});
	});

	describe("array_inactive", () => {
		it("reports an inactive array, even when it also lists missing disks", () => {
			const breaches = findStorageBreaches(makeMonitor(), [makeArray({ state: "inactive", level: "", degraded_disks: 1 })], undefined);
			expect(breaches).toEqual([{ subject: "/dev/md1", reason: "array_inactive", detail: "inactive" }]);
		});
	});

	describe("drive_failed", () => {
		it("reports a drive whose overall health is FAILED", () => {
			const drive = makeDrive({ smart_overall_health_self_assessment_test_result: "FAILED" });
			expect(findStorageBreaches(makeMonitor(), undefined, [drive])).toEqual([failedDriveBreach]);
		});

		it("reports a drive with the disk_failing warning", () => {
			const [breach] = findStorageBreaches(makeMonitor(), undefined, [makeDrive({ warnings: ["disk_failing"] })]);
			expect(breach).toMatchObject({ reason: "drive_failed", detail: "disk failing" });
		});

		it("reports failed rather than warning when both apply", () => {
			const drive = makeDrive({ smart_overall_health_self_assessment_test_result: "FAILED", pending_sectors: 37 });
			const breaches = findStorageBreaches(makeMonitor(), undefined, [drive]);
			expect(breaches.map((b) => b.reason)).toEqual(["drive_failed"]);
		});
	});

	describe("drive_warning", () => {
		it("reports pending and uncorrectable sectors", () => {
			const [breach] = findStorageBreaches(makeMonitor(), undefined, [makeDrive({ pending_sectors: 37, offline_uncorrectable: 1 })]);
			expect(breach).toMatchObject({ reason: "drive_warning", detail: "37 pending sectors, 1 uncorrectable sector" });
		});

		it("reports a pre-fail attribute at threshold", () => {
			const [breach] = findStorageBreaches(makeMonitor(), undefined, [makeDrive({ warnings: ["prefail_attribute_at_threshold"] })]);
			expect(breach).toMatchObject({ reason: "drive_warning", detail: "pre-fail attribute at threshold" });
		});

		it("does not treat reallocated sectors or other warnings as a warning", () => {
			const drive = makeDrive({ reallocated_sectors: 184, warnings: ["attribute_was_at_threshold", "error_log_has_errors"] });
			expect(findStorageBreaches(makeMonitor(), undefined, [drive])).toEqual([]);
		});

		it("does not read null counters as values", () => {
			const drive = makeDrive({ pending_sectors: null, offline_uncorrectable: null });
			expect(findStorageBreaches(makeMonitor(), undefined, [drive])).toEqual([]);
		});
	});

	it.each(["standby", "unsupported", "error"] as const)("ignores a %s drive", (status) => {
		expect(findStorageBreaches(makeMonitor(), undefined, [makeUnreadDrive(status)])).toEqual([]);
	});

	describe("monitor options", () => {
		const raid = [makeArray({ degraded_disks: 1 }), makeArray({ device: "/dev/md2", state: "inactive" })];
		const drives = [
			makeDrive({ smart_overall_health_self_assessment_test_result: "FAILED" }),
			makeDrive({ device: "/dev/sdc", serial_number: "S2", pending_sectors: 3 }),
		];
		const reasons = (monitor: Monitor) => findStorageBreaches(monitor, raid, drives).map((b) => b.reason);

		it("reports every reason with every option on", () => {
			expect(reasons(makeMonitor())).toEqual(["array_degraded", "array_inactive", "drive_failed", "drive_warning"]);
		});

		it("storageAlertOnArrayDegraded covers degraded and inactive arrays", () => {
			expect(reasons(makeMonitor({ storageAlertOnArrayDegraded: false }))).toEqual(["drive_failed", "drive_warning"]);
		});

		it("storageAlertOnDriveFailure covers failed drives", () => {
			expect(reasons(makeMonitor({ storageAlertOnDriveFailure: false }))).toEqual(["array_degraded", "array_inactive", "drive_warning"]);
		});

		it("storageAlertOnDriveWarning covers drive warnings", () => {
			expect(reasons(makeMonitor({ storageAlertOnDriveWarning: false }))).toEqual(["array_degraded", "array_inactive", "drive_failed"]);
		});

		it("reports nothing when the options are unset", () => {
			const monitor = makeMonitor({
				storageAlertOnArrayDegraded: undefined,
				storageAlertOnDriveFailure: undefined,
				storageAlertOnDriveWarning: undefined,
			});
			expect(reasons(monitor)).toEqual([]);
		});
	});
});

describe("nextStorageBreaches", () => {
	it("keeps array breaches when the check has no raid", () => {
		expect(nextStorageBreaches(makeMonitor(), [degradedArrayBreach], undefined, undefined)).toEqual([degradedArrayBreach]);
	});

	it("clears array breaches when the check reports the array healthy", () => {
		expect(nextStorageBreaches(makeMonitor(), [degradedArrayBreach], [makeArray()], undefined)).toEqual([]);
	});

	it("keeps drive breaches when SMART was not fetched on this check", () => {
		expect(nextStorageBreaches(makeMonitor(), [failedDriveBreach], [makeArray()], undefined)).toEqual([failedDriveBreach]);
	});

	it("clears a drive breach when the same drive now reads healthy", () => {
		expect(nextStorageBreaches(makeMonitor(), [failedDriveBreach], undefined, [makeDrive()])).toEqual([]);
	});

	it.each(["standby", "unsupported", "error"] as const)("keeps a drive breach while its device reads as %s", (status) => {
		expect(nextStorageBreaches(makeMonitor(), [failedDriveBreach], undefined, [makeUnreadDrive(status)])).toEqual([failedDriveBreach]);
	});

	it("clears a drive breach when the device now holds a different, healthy drive", () => {
		const replacement = makeDrive({ serial_number: "NEW-SERIAL" });
		expect(nextStorageBreaches(makeMonitor(), [failedDriveBreach], undefined, [replacement])).toEqual([]);
	});

	it("clears a drive breach when the device is gone", () => {
		expect(nextStorageBreaches(makeMonitor(), [failedDriveBreach], undefined, [makeDrive({ device: "/dev/sdc", serial_number: "OTHER" })])).toEqual(
			[]
		);
	});

	it("follows a drive that moved to another device path", () => {
		const moved = makeDrive({ device: "/dev/sdc", smart_overall_health_self_assessment_test_result: "FAILED" });
		expect(nextStorageBreaches(makeMonitor(), [failedDriveBreach], undefined, [moved])).toEqual([{ ...failedDriveBreach, device: "/dev/sdc" }]);
	});

	it("drops kept breaches whose option was turned off", () => {
		const monitor = makeMonitor({ storageAlertOnArrayDegraded: false, storageAlertOnDriveFailure: false });
		expect(nextStorageBreaches(monitor, [degradedArrayBreach, failedDriveBreach], undefined, undefined)).toEqual([]);
	});
});

describe("findOpenedStorageBreaches", () => {
	it("returns breaches whose subject and reason were not active", () => {
		const warning: StorageBreach = { ...failedDriveBreach, reason: "drive_warning", detail: "3 pending sectors" };
		expect(findOpenedStorageBreaches([warning], [failedDriveBreach, degradedArrayBreach])).toEqual([failedDriveBreach, degradedArrayBreach]);
	});

	it("does not treat a changed detail on the same subject and reason as new", () => {
		const before: StorageBreach = { ...failedDriveBreach, reason: "drive_warning", detail: "3 pending sectors" };
		const after: StorageBreach = { ...before, detail: "40 pending sectors" };
		expect(findOpenedStorageBreaches([before], [after])).toEqual([]);
	});
});

describe("describeStorageBreach", () => {
	it("describes an array by device", () => {
		expect(describeStorageBreach(degradedArrayBreach)).toBe("/dev/md1: degraded, 1 of 2 disks missing");
	});

	it("describes a drive by model and serial", () => {
		expect(describeStorageBreach(failedDriveBreach)).toBe("WDC WD40EFRX-68N32N0 (WD-WCC7K1PL4R2X): health FAILED");
	});

	it("falls back to the serial when the model is unknown", () => {
		expect(describeStorageBreach({ ...failedDriveBreach, model: undefined })).toBe("WD-WCC7K1PL4R2X: health FAILED");
	});
});
