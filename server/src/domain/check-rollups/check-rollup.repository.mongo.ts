import mongoose from "mongoose";
import { CheckModel } from "@/domain/checks/check.model.js";
import { CheckRollupModel } from "@/domain/check-rollups/check-rollup.model.js";
import {
	buildCoreRollupStages,
	buildDailyStatusReadStages,
	buildRollupMergeStage,
	buildUptimeReadStages,
} from "@/domain/check-rollups/check-rollup.pipeline.js";
import {
	buildHardwareDisksRollupStages,
	buildHardwareLevelsRollupStages,
	buildHardwareRollupMergeStage,
} from "@/domain/check-rollups/check-rollup.hardware.pipeline.js";
import type { ICheckRollupsRepository } from "@/domain/check-rollups/check-rollup.repository.interface.js";
import {
	ROLLUP_RAW_TAIL_HOURS,
	floorToRollupBucket,
	type HardwareMonitorInterval,
	type UptimeRollupBucket,
} from "@/domain/check-rollups/check-rollup.type.js";
import type { DailyCheckBucket, UptimeChecksResult } from "@/domain/checks/check.type.js";
import type { UptimeDetailsSupportedType } from "@/domain/monitors/monitor.type.js";
import type { DateRange } from "@/types/query.js";
import { getDateForRange, getDateFormat } from "@/utils/dataUtils.js";

const SERVICE_NAME = "CheckRollupsRepository";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RAW_TAIL_MS = ROLLUP_RAW_TAIL_HOURS * 60 * 60 * 1000;
const ratio = (sum: number, count: number): number => (count > 0 ? sum / count : 0);
class MongoCheckRollupsRepository implements ICheckRollupsRepository {
	static SERVICE_NAME = SERVICE_NAME;

	rollUp = async (from: Date, to: Date, hardwareIntervals: HardwareMonitorInterval[] = []): Promise<void> => {
		const collectionName = CheckRollupModel.collection.collectionName;
		await CheckModel.aggregate([...buildCoreRollupStages(from, to), buildRollupMergeStage(collectionName)]);
		await CheckModel.aggregate([...buildHardwareLevelsRollupStages(from, to), buildHardwareRollupMergeStage(collectionName)]);
		if (hardwareIntervals.length === 0) {
			return;
		}
		await CheckModel.aggregate([...buildHardwareDisksRollupStages(from, to, hardwareIntervals), buildHardwareRollupMergeStage(collectionName)]);
	};

	findLatestBucketStart = async (): Promise<Date | null> => {
		const latest = await CheckRollupModel.findOne().sort({ bucketStart: -1 }).select({ bucketStart: 1 }).lean();
		return latest?.bucketStart ?? null;
	};

	findUptimeDateRange = async (monitorId: string, monitorType: UptimeDetailsSupportedType, dateRange: DateRange): Promise<UptimeChecksResult> => {
		const now = new Date();
		const from = floorToRollupBucket(getDateForRange(dateRange).getTime());
		const rawFrom = Math.max(from, floorToRollupBucket(now.getTime()) - RAW_TAIL_MS);
		const buckets = await CheckRollupModel.aggregate<UptimeRollupBucket>(
			buildUptimeReadStages({
				monitorId: new mongoose.Types.ObjectId(monitorId),
				from: new Date(from),
				rawFrom: new Date(rawFrom),
				now,
				dateFormat: getDateFormat(dateRange),
				checksCollectionName: CheckModel.collection.collectionName,
			})
		);
		return this.toUptimeChecksResult(monitorType, buckets);
	};

	getDailyStatusBuckets = async (monitorIds: string[], days: number, timezone: string): Promise<DailyCheckBucket[]> => {
		const now = new Date();
		const from = floorToRollupBucket(now.getTime() - days * MS_PER_DAY);
		const rawFrom = Math.max(from, floorToRollupBucket(now.getTime()) - RAW_TAIL_MS);
		return CheckRollupModel.aggregate<DailyCheckBucket>(
			buildDailyStatusReadStages({
				monitorIds: monitorIds.map((id) => new mongoose.Types.ObjectId(id)),
				from: new Date(from),
				rawFrom: new Date(rawFrom),
				now,
				timezone,
				checksCollectionName: CheckModel.collection.collectionName,
			})
		);
	};

	deleteByMonitorId = async (monitorId: string): Promise<number> => {
		const result = await CheckRollupModel.deleteMany({ monitorId: new mongoose.Types.ObjectId(monitorId) });
		return result.deletedCount ?? 0;
	};

	deleteByTeamId = async (teamId: string): Promise<number> => {
		const result = await CheckRollupModel.deleteMany({ teamId: new mongoose.Types.ObjectId(teamId) });
		return result.deletedCount ?? 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const result = await CheckRollupModel.deleteMany({ monitorId: { $nin: objectIds } });
		return result.deletedCount ?? 0;
	};

	private toUptimeChecksResult = (monitorType: UptimeDetailsSupportedType, buckets: UptimeRollupBucket[]): UptimeChecksResult => {
		const counted = buckets.filter((bucket) => bucket.totalChecks > 0);
		const totalChecks = counted.reduce((sum, bucket) => sum + bucket.totalChecks, 0);
		const upChecks = counted.reduce((sum, bucket) => sum + bucket.upChecks, 0);
		const responseTimeSum = counted.reduce((sum, bucket) => sum + bucket.responseTimeSum, 0);
		const responseTimeCount = counted.reduce((sum, bucket) => sum + bucket.responseTimeCount, 0);

		return {
			monitorType,
			groupedChecks: counted.map((bucket) => ({
				bucketDate: bucket._id,
				totalChecks: bucket.totalChecks,
				avgResponseTime: ratio(bucket.responseTimeSum, bucket.responseTimeCount),
				avgDns: ratio(bucket.dnsSum, bucket.totalChecks),
				avgTcp: ratio(bucket.tcpSum, bucket.totalChecks),
				avgTls: ratio(bucket.tlsSum, bucket.totalChecks),
				avgRequest: ratio(bucket.requestSum, bucket.totalChecks),
				avgFirstByte: ratio(bucket.firstByteSum, bucket.totalChecks),
				avgDownload: ratio(bucket.downloadSum, bucket.totalChecks),
			})),
			groupedUpChecks: counted
				.filter((bucket) => bucket.upChecks > 0)
				.map((bucket) => ({
					bucketDate: bucket._id,
					totalChecks: bucket.upChecks,
					avgResponseTime: ratio(bucket.upResponseTimeSum, bucket.upResponseTimeCount),
				})),
			groupedDownChecks: counted
				.filter((bucket) => bucket.downChecks > 0)
				.map((bucket) => ({
					bucketDate: bucket._id,
					totalChecks: bucket.downChecks,
					avgResponseTime: ratio(bucket.downResponseTimeSum, bucket.downResponseTimeCount),
				})),
			uptimePercentage: ratio(upChecks, totalChecks),
			avgResponseTime: ratio(responseTimeSum, responseTimeCount),
		};
	};
}

export default MongoCheckRollupsRepository;
