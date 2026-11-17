import type { z } from "zod";
import type { CheckDrive, CheckRaidArray } from "@/domain/checks/check.type.js";
import type { Monitor } from "@/domain/monitors/monitor.type.js";
import { StorageAlertReasons, type storageBreachSchema } from "@/domain/storage/storage.schema.js";

export { StorageAlertReasons };
export type StorageAlertReason = (typeof StorageAlertReasons)[number];
export type StorageBreach = z.infer<typeof storageBreachSchema>;

const ArrayReasons: readonly StorageAlertReason[] = ["array_degraded", "array_inactive"];

type StorageAlertOptions = Pick<Monitor, "storageAlertOnArrayDegraded" | "storageAlertOnDriveFailure" | "storageAlertOnDriveWarning">;

const isArrayReason = (reason: StorageAlertReason): boolean => ArrayReasons.includes(reason);

const isReasonEnabled = (monitor: StorageAlertOptions, reason: StorageAlertReason): boolean => {
	switch (reason) {
		case "array_degraded":
		case "array_inactive":
			return monitor.storageAlertOnArrayDegraded === true;
		case "drive_failed":
			return monitor.storageAlertOnDriveFailure === true;
		case "drive_warning":
			return monitor.storageAlertOnDriveWarning === true;
	}
};

const findArrayBreach = (array: CheckRaidArray): StorageBreach | null => {
	if (array.state === "inactive") {
		return { subject: array.device, reason: "array_inactive", detail: "inactive" };
	}
	const missing = array.degraded_disks ?? 0;
	if (missing > 0) {
		const total = array.raid_disks;
		const detail = typeof total === "number" ? `degraded, ${missing} of ${total} disks missing` : `degraded, ${missing} disk(s) missing`;
		return { subject: array.device, reason: "array_degraded", detail };
	}
	return null;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const findDriveBreach = (drive: CheckDrive): StorageBreach | null => {
	// Only drives that were read have a serial and values; standby, unsupported and error entries say nothing new
	if (drive.status !== "ok" || !drive.serial_number) return null;
	const base = { subject: drive.serial_number, device: drive.device, model: drive.model_name || undefined };

	const healthFailed = drive.smart_overall_health_self_assessment_test_result.toUpperCase() === "FAILED";
	if (healthFailed || drive.warnings.includes("disk_failing")) {
		return { ...base, reason: "drive_failed", detail: healthFailed ? "health FAILED" : "disk failing" };
	}

	const parts: string[] = [];
	if (drive.warnings.includes("prefail_attribute_at_threshold")) parts.push("pre-fail attribute at threshold");
	// Null means "not reported", never 0
	if ((drive.pending_sectors ?? 0) > 0) parts.push(plural(drive.pending_sectors as number, "pending sector"));
	if ((drive.offline_uncorrectable ?? 0) > 0) parts.push(plural(drive.offline_uncorrectable as number, "uncorrectable sector"));
	if (parts.length > 0) {
		return { ...base, reason: "drive_warning", detail: parts.join(", ") };
	}
	return null;
};

// Breaches in the given data, filtered by the monitor's storage alert options. Pass undefined for a source that was not
// read on this check; it contributes nothing.
export const findStorageBreaches = (
	monitor: StorageAlertOptions,
	raid: CheckRaidArray[] | undefined,
	drives: CheckDrive[] | undefined
): StorageBreach[] => {
	const breaches: StorageBreach[] = [];
	for (const array of raid ?? []) {
		const breach = findArrayBreach(array);
		if (breach && isReasonEnabled(monitor, breach.reason)) breaches.push(breach);
	}
	for (const drive of drives ?? []) {
		const breach = findDriveBreach(drive);
		if (breach && isReasonEnabled(monitor, breach.reason)) breaches.push(breach);
	}
	return breaches;
};

// A previous drive breach still stands when its drive could not be read this time (asleep, timed out, no SMART), so a
// failing drive that spins down does not read as recovered. It is dropped when the device is gone or now reads as ok,
// in which case that reading decides.
const isDriveStillUnread = (breach: StorageBreach, drives: CheckDrive[]): boolean => {
	if (drives.some((drive) => drive.status === "ok" && drive.serial_number === breach.subject)) return false;
	return drives.some((drive) => drive.device === breach.device && drive.status !== "ok");
};

// The active storage breaches after a check. RAID arrives on every check from a Capture that supports it, drives only on
// checks where SMART was fetched, so a source missing from this check keeps its previous breaches rather than reading as
// "all clear". Previous breaches are re-filtered by the current options so turning an option off clears its alerts.
export const nextStorageBreaches = (
	monitor: StorageAlertOptions,
	previous: StorageBreach[],
	raid: CheckRaidArray[] | undefined,
	drives: CheckDrive[] | undefined
): StorageBreach[] => {
	const current = findStorageBreaches(monitor, raid, drives);
	const kept = previous.filter((breach) => {
		if (!isReasonEnabled(monitor, breach.reason)) return false;
		if (isArrayReason(breach.reason)) return raid === undefined;
		if (drives === undefined) return true;
		return isDriveStillUnread(breach, drives);
	});
	return [...current, ...kept];
};

const breachKey = (breach: StorageBreach) => `${breach.reason}:${breach.subject}`;

// Breaches in next whose subject+reason was not active before. A changed detail on the same subject+reason (e.g. more
// pending sectors) is not new.
export const findOpenedStorageBreaches = (previous: StorageBreach[], next: StorageBreach[]): StorageBreach[] => {
	const before = new Set(previous.map(breachKey));
	return next.filter((breach) => !before.has(breachKey(breach)));
};

export const describeStorageBreach = (breach: StorageBreach): string => {
	if (isArrayReason(breach.reason)) return `${breach.subject}: ${breach.detail}`;
	const name = breach.model ? `${breach.model} (${breach.subject})` : breach.subject;
	return `${name}: ${breach.detail}`;
};
