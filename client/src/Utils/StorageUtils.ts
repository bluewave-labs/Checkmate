import type {
	CheckDrive,
	CheckErrorInfo,
	CheckRaidArray,
	CheckRaidMember,
	SmartWarning,
	SnapshotDiskInfo,
} from "@/Types/Check";

// Storage health helpers for the infrastructure Storage tab and the drive detail page. Capture sends raw mdadm
// and smartctl values; everything derived from them (array health, member to drive, mount points) lives here.

export const StorageTones = ["success", "warning", "error", "muted"] as const;
export type StorageTone = (typeof StorageTones)[number];

export const ArrayHealths = ["healthy", "degraded", "inactive", "rebuilding"] as const;
export type ArrayHealth = (typeof ArrayHealths)[number];

export const MemberStates = [
	"inSync",
	"faulty",
	"spare",
	"spareRebuilding",
	"other",
] as const;
export type MemberState = (typeof MemberStates)[number];

export const DriveHealths = [
	"passed",
	"failed",
	"asleep",
	"unsupported",
	"unreadable",
] as const;
export type DriveHealth = (typeof DriveHealths)[number];

// md sync actions that rebuild redundancy, as opposed to a scrub (check/repair) or nothing (idle/frozen)
const REBUILD_SYNC_ACTIONS = ["recover", "resync", "reshape"];
const SMARTCTL_MISSING = "smartctl is not installed";

export const ARRAY_HEALTH_TONES: Record<ArrayHealth, StorageTone> = {
	healthy: "success",
	degraded: "error",
	inactive: "error",
	rebuilding: "warning",
};

export const MEMBER_STATE_TONES: Record<MemberState, StorageTone> = {
	inSync: "success",
	faulty: "error",
	spare: "muted",
	spareRebuilding: "warning",
	other: "muted",
};

export const DRIVE_HEALTH_TONES: Record<DriveHealth, StorageTone> = {
	passed: "success",
	failed: "error",
	asleep: "muted",
	unsupported: "muted",
	unreadable: "warning",
};

export const isArrayDegraded = (array: CheckRaidArray): boolean =>
	(array.degraded_disks ?? 0) > 0;

export const getArrayHealth = (array: CheckRaidArray): ArrayHealth => {
	if (array.state === "inactive") return "inactive";
	if (isArrayDegraded(array)) return "degraded";
	if (array.sync_action && REBUILD_SYNC_ACTIONS.includes(array.sync_action)) {
		return "rebuilding";
	}
	return "healthy";
};

// Arrays that need attention: missing members or not running at all
export const isArrayAtRisk = (array: CheckRaidArray): boolean => {
	const health = getArrayHealth(array);
	return health === "degraded" || health === "inactive";
};

// The member being rebuilt onto: a spare while md is recovering
export const getRebuildTarget = (array: CheckRaidArray): CheckRaidMember | undefined => {
	if (array.sync_action !== "recover") return undefined;
	return array.members.find((member) => member.state.includes("spare"));
};

export const getMemberState = (
	array: CheckRaidArray,
	member: CheckRaidMember
): MemberState => {
	if (member.state.includes("faulty")) return "faulty";
	if (member.state.includes("spare")) {
		return getRebuildTarget(array)?.device === member.device
			? "spareRebuilding"
			: "spare";
	}
	if (member.state.includes("in_sync")) return "inSync";
	return "other";
};

// Present members out of all slots. Null when md does not report slot counts.
export const getArrayDisks = (
	array: CheckRaidArray
): { present: number; total: number } | null => {
	if (array.raid_disks === null || array.raid_disks === undefined) return null;
	return {
		present: array.raid_disks - (array.degraded_disks ?? 0),
		total: array.raid_disks,
	};
};

// "raid1" -> "RAID 1"; inactive arrays report an empty level
export const formatRaidLevel = (level: string): string => {
	const match = /^raid(\d+)$/i.exec(level);
	if (match) return `RAID ${match[1]}`;
	return level;
};

// Size and mount point come from the disk entry for the same md device. Arrays used under LVM have none.
export const findArrayDisk = (
	array: CheckRaidArray,
	disks: SnapshotDiskInfo[] | undefined
): SnapshotDiskInfo | undefined => disks?.find((disk) => disk.device === array.device);

// A member partition belongs to the drive whose device it starts with (/dev/sdb2 -> /dev/sdb,
// /dev/nvme0n1p2 -> /dev/nvme0n1). NVMe drives may be reported as the controller (/dev/nvme0).
// The remainder must be a partition suffix, so /dev/sdaa2 does not match /dev/sda.
export const isMemberOfDrive = (memberDevice: string, driveDevice: string): boolean => {
	if (!driveDevice || !memberDevice.startsWith(driveDevice)) return false;
	const rest = memberDevice.slice(driveDevice.length);
	if (/^(p?\d+)?$/.test(rest)) return true;
	return /^\/dev\/nvme\d+$/.test(driveDevice) && /^n\d+(p\d+)?$/.test(rest);
};

export const findMemberDrive = <T extends CheckDrive>(
	member: CheckRaidMember,
	drives: T[] | undefined
): T | undefined => drives?.find((drive) => isMemberOfDrive(member.device, drive.device));

// Arrays with at least one member on this drive
export const findDriveArrays = (
	drive: CheckDrive,
	arrays: CheckRaidArray[] | undefined
): CheckRaidArray[] =>
	(arrays ?? []).filter((array) =>
		array.members.some((member) => isMemberOfDrive(member.device, drive.device))
	);

// Drives are keyed by serial: device paths change across reboots
export const getDrivePath = (monitorId: string, serial: string): string =>
	`/infrastructure/${monitorId}/drives/${encodeURIComponent(serial)}`;

export const isDriveFailed = (drive: CheckDrive): boolean =>
	drive.smart_overall_health_self_assessment_test_result === "FAILED" ||
	drive.warnings.includes("disk_failing");

export const getDriveHealth = (drive: CheckDrive): DriveHealth => {
	if (drive.status === "standby") return "asleep";
	if (drive.status === "unsupported") return "unsupported";
	if (drive.status === "error") return "unreadable";
	return isDriveFailed(drive) ? "failed" : "passed";
};

// Values are shown for drives read this time and for sleeping drives filled from their last reading
export const hasDriveValues = (drive: CheckDrive & { lastKnownAt?: string }): boolean =>
	drive.status === "ok" || (drive.status === "standby" && Boolean(drive.lastKnownAt));

// "38 Celsius" -> 38; null when absent
export const parseTemperature = (temperature: string): number | null => {
	const value = parseFloat(temperature);
	return Number.isFinite(value) ? value : null;
};

// Decimal strings from smartctl ("41882", "3%"); null when empty
export const parseCount = (value: string): number | null => {
	const parsed = parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const isNvme = (drive: CheckDrive): boolean => drive.protocol === "NVMe";

// Capture's SMART errors name the device ("smartctl failed for /dev/sde: timed out after 20s").
// Returns the reason without that prefix.
export const getDriveErrorReason = (
	drive: CheckDrive,
	errors: CheckErrorInfo[] | undefined
): string | undefined => {
	const match = errors?.find((error) => error.err.includes(drive.device));
	if (!match) return undefined;
	const prefix = `${drive.device}: `;
	const index = match.err.indexOf(prefix);
	return index >= 0 ? match.err.slice(index + prefix.length) : match.err;
};

export const isSmartctlMissing = (errors: CheckErrorInfo[] | undefined): boolean =>
	Boolean(errors?.some((error) => error.err.includes(SMARTCTL_MISSING)));

// Warnings that mean the drive is failing now, as opposed to something worth watching
const SEVERE_WARNINGS: SmartWarning[] = [
	"disk_failing",
	"prefail_attribute_at_threshold",
];

export const getWarningTone = (warning: SmartWarning): StorageTone =>
	SEVERE_WARNINGS.includes(warning) ? "error" : "warning";

// A counter is a warning when non-zero, and an error on a drive that already failed
export const getCounterTone = (
	value: number | null | undefined,
	failed: boolean
): StorageTone => {
	if (!value) return "muted";
	return failed ? "error" : "warning";
};
