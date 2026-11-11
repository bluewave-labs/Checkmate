import { CheckModel } from "@/domain/checks/check.model.js";
import mongoose from "mongoose";
import { EXCLUDE_DEGRADED_EGRESS_MATCH } from "@/domain/checks/check.query.js";

type DateRange = { start: Date; end: Date };

// How far back the "latest" RAID and drive lookups search. Healthy hosts report RAID on every check and SMART every
// 10 minutes, so this only matters when neither is present (older Capture): it bounds the scan instead of walking
// the monitor's whole history on every page load.
export const STORAGE_LATEST_LOOKBACK_MS = 24 * 60 * 60 * 1000;

const hardwareChecksMatch = (monitorId: string) => ({
	"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
	"metadata.type": "hardware",
	...EXCLUDE_DEGRADED_EGRESS_MATCH,
});

const lookbackStart = () => new Date(Date.now() - STORAGE_LATEST_LOOKBACK_MS);

export const getLatestRaidCheck = async (monitorId: string) =>
	CheckModel.findOne({ ...hardwareChecksMatch(monitorId), createdAt: { $gte: lookbackStart() }, raid: { $exists: true } })
		.sort({ createdAt: -1 })
		.select("raid createdAt")
		.lean();

export const getLatestDrivesCheck = async (monitorId: string) =>
	CheckModel.findOne({ ...hardwareChecksMatch(monitorId), createdAt: { $gte: lookbackStart() }, drives: { $exists: true } })
		.sort({ createdAt: -1 })
		.select("drives errors createdAt")
		.lean();

// The most recent reading in which this device path reported a serial. Not bounded by the lookback: a drive can stay
// asleep for days, and its last awake reading is what identifies it.
export const getLastKnownDriveCheck = async (monitorId: string, device: string) =>
	CheckModel.findOne({
		...hardwareChecksMatch(monitorId),
		drives: { $elemMatch: { device, serial_number: { $nin: ["", null] } } },
	})
		.sort({ createdAt: -1 })
		.select("drives createdAt")
		.lean();

export type DriveHistoryRow = {
	_id: string; // serial_number
	points: {
		bucketDate: string;
		reallocated_sectors: number | null;
		pending_sectors: number | null;
		offline_uncorrectable: number | null;
		media_errors: number | null;
		temperature: number | null;
	}[];
};

// Capture sends temperature as "38 Celsius"; "" when absent, which converts to null
const temperatureCelsius = {
	$convert: {
		input: { $arrayElemAt: [{ $split: [{ $ifNull: ["$drives.temperature", ""] }, " "] }, 0] },
		to: "double",
		onError: null,
		onNull: null,
	},
};

// Per-serial series over the checks that carry SMART data. Only "ok" readings have values. Counters only grow, so a
// bucket takes the maximum; $max and $avg skip nulls and yield null when nothing in the bucket reported the value.
export const getDriveHistory = async (monitorId: string, dates: DateRange, dateString: string): Promise<DriveHistoryRow[]> =>
	CheckModel.aggregate<DriveHistoryRow>([
		{
			$match: {
				...hardwareChecksMatch(monitorId),
				createdAt: { $gte: dates.start, $lte: dates.end },
				drives: { $exists: true },
			},
		},
		{ $unwind: "$drives" },
		{ $match: { "drives.status": "ok", "drives.serial_number": { $nin: ["", null] } } },
		{
			$group: {
				_id: { serial: "$drives.serial_number", bucket: { $dateToString: { format: dateString, date: "$createdAt" } } },
				reallocated_sectors: { $max: "$drives.reallocated_sectors" },
				pending_sectors: { $max: "$drives.pending_sectors" },
				offline_uncorrectable: { $max: "$drives.offline_uncorrectable" },
				media_errors: { $max: "$drives.media_errors" },
				temperature: { $avg: temperatureCelsius },
			},
		},
		{ $sort: { "_id.bucket": 1 } },
		{
			$group: {
				_id: "$_id.serial",
				points: {
					$push: {
						bucketDate: "$_id.bucket",
						reallocated_sectors: "$reallocated_sectors",
						pending_sectors: "$pending_sectors",
						offline_uncorrectable: "$offline_uncorrectable",
						media_errors: "$media_errors",
						temperature: "$temperature",
					},
				},
			},
		},
		{ $sort: { _id: 1 } },
	]);
