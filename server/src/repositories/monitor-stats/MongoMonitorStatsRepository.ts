import { type MonitorStatsDocument, MonitorStatsModel } from "@/db/models/index.js";
import type { MonitorStats, CheckResultInput } from "@/types/index.js";
import { IMonitorStatsRepository } from "@/repositories/index.js";
import mongoose from "mongoose";
import { AppError } from "@/utils/AppError.js";
class MongoMonitorStatsRepository implements IMonitorStatsRepository {
	private toEntity = (doc: MonitorStatsDocument): MonitorStats => {
		const toStringId = (value: unknown): string => {
			if (value instanceof mongoose.Types.ObjectId) {
				return value.toString();
			}
			return value?.toString() ?? "";
		};

		const toDateString = (value: Date | string): string => {
			return value instanceof Date ? value.toISOString() : value;
		};

		return {
			id: toStringId(doc._id),
			monitorId: toStringId(doc.monitorId),
			avgResponseTime: doc.avgResponseTime,
			maxResponseTime: doc.maxResponseTime,
			totalChecks: doc.totalChecks,
			totalUpChecks: doc.totalUpChecks,
			totalDownChecks: doc.totalDownChecks,
			uptimePercentage: doc.uptimePercentage,
			lastCheckTimestamp: doc.lastCheckTimestamp,
			lastResponseTime: doc.lastResponseTime,
			timeOfLastFailure: doc.timeOfLastFailure,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (data: Omit<MonitorStats, "id" | "createdAt" | "updatedAt">): Promise<MonitorStats> => {
		const created = await MonitorStatsModel.create(data);
		return this.toEntity(created);
	};

	findByMonitorId = async (monitorId: string): Promise<MonitorStats> => {
		const monitorStats = await MonitorStatsModel.findOne({ monitorId: new mongoose.Types.ObjectId(monitorId) });
		if (!monitorStats) {
			throw new AppError({ message: "Monitor stats not found", status: 404 });
		}
		return this.toEntity(monitorStats);
	};

	updateByMonitorId = async (monitorId: string, result: CheckResultInput): Promise<MonitorStats> => {
		const { status, responseTime, now } = result;
		const objectId = new mongoose.Types.ObjectId(monitorId);
		const upDelta = status ? 1 : 0;
		const downDelta = status ? 0 : 1;
		const pipeline = [
			{
				$set: {
					monitorId: objectId,
					totalChecks: { $add: [{ $ifNull: ["$totalChecks", 0] }, 1] },
					totalUpChecks: { $add: [{ $ifNull: ["$totalUpChecks", 0] }, upDelta] },
					totalDownChecks: { $add: [{ $ifNull: ["$totalDownChecks", 0] }, downDelta] },
					avgResponseTime: {
						$divide: [
							{
								$add: [{ $multiply: [{ $ifNull: ["$avgResponseTime", 0] }, { $ifNull: ["$totalChecks", 0] }] }, responseTime],
							},
							{ $add: [{ $ifNull: ["$totalChecks", 0] }, 1] },
						],
					},
					uptimePercentage: {
						$divide: [{ $add: [{ $ifNull: ["$totalUpChecks", 0] }, upDelta] }, { $add: [{ $ifNull: ["$totalChecks", 0] }, 1] }],
					},
					maxResponseTime: { $max: [{ $ifNull: ["$maxResponseTime", 0] }, responseTime] },
					lastResponseTime: responseTime,
					lastCheckTimestamp: now,
					timeOfLastFailure: status
						? {
								$cond: [{ $eq: [{ $ifNull: ["$timeOfLastFailure", 0] }, 0] }, now, "$timeOfLastFailure"],
							}
						: 0,
				},
			},
		];

		const updated = await MonitorStatsModel.findOneAndUpdate({ monitorId: objectId }, pipeline, {
			upsert: true,
			new: true,
			setDefaultsOnInsert: true,
		});
		if (!updated) {
			throw new AppError({ message: "Failed to apply check result to monitor stats", status: 500 });
		}
		return this.toEntity(updated);
	};

	deleteByMonitorId = async (monitorId: string) => {
		const deleted = await MonitorStatsModel.findOneAndDelete({ monitorId: new mongoose.Types.ObjectId(monitorId) });
		if (!deleted) {
			throw new AppError({ message: "Monitor stats not found", status: 404 });
		}
		return this.toEntity(deleted);
	};

	deleteByMonitorIds = async (monitorIds: string[]): Promise<number> => {
		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const result = await MonitorStatsModel.deleteMany({ monitorId: { $in: objectIds } });
		return result.deletedCount ?? 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const result = await MonitorStatsModel.deleteMany({ monitorId: { $nin: objectIds } });
		return result.deletedCount ?? 0;
	};
}

export default MongoMonitorStatsRepository;
