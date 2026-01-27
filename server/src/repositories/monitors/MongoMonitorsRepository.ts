import { MonitorModel } from "@/db/models/index.js";
import type { MonitorDocument, CheckSnapshotDocument } from "@/db/models/index.js";
import type { Monitor, MonitorsSummary, MonitorWithChecks, CheckSnapshot, Check } from "@/types/index.js";
import mongoose, { type FilterQuery, type PipelineStage } from "mongoose";
import type { IMonitorsRepository, TeamQueryConfig, SummaryConfig } from "./IMonitorsRepository.js";
import { AppError } from "@/utils/AppError.js";

class MongoMonitorsRepository implements IMonitorsRepository {
	create = async (monitor: Monitor, teamId: string, userId: string) => {
		const monitorModel = new MonitorModel({ ...monitor, teamId, userId });
		const saved = await monitorModel.save();
		return this.toEntity(saved);
	};

	createBulkMonitors = async (monitors: Monitor[]): Promise<Monitor[]> => {
		if (!monitors.length) {
			return [];
		}
		const payload = monitors.map((monitor) => ({ ...monitor, notifications: undefined }));
		const inserted = await MonitorModel.insertMany(payload, { ordered: false });
		return this.mapDocuments(inserted);
	};

	findById = async (monitorId: string, teamId: string): Promise<Monitor> => {
		const match: { _id: string; teamId: string } = { _id: monitorId, teamId };
		const monitor = await MonitorModel.findOne(match);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found`, status: 404 });
		}
		return this.toEntity(monitor);
	};

	findAll = async (): Promise<Monitor[]> => {
		const monitors = await MonitorModel.find();
		return this.mapDocuments(monitors);
	};

	findByTeamId = async (teamId: string, config: TeamQueryConfig): Promise<Monitor[] | null> => {
		const { page = 0, rowsPerPage = 0, filter, field = "createdAt", order = "desc", type, limit } = config ?? {};

		const query: Record<string, unknown> = {
			teamId: new mongoose.Types.ObjectId(teamId),
		};

		if (type !== undefined) {
			query.type = Array.isArray(type) ? { $in: type } : type;
		}

		if (filter !== undefined) {
			switch (field) {
				case "name":
					query.$or = [{ name: { $regex: filter, $options: "i" } }, { url: { $regex: filter, $options: "i" } }];
					break;
				case "isActive":
					query.isActive = filter === "true";
					break;
				case "status":
					query.status = filter === "true";
					break;
				case "type":
					query.type = filter;
					break;
				default:
					break;
			}
		}

		const sort = { [field]: order === "asc" ? 1 : -1 } as const;
		const skip = Math.max(page, 0) * rowsPerPage;

		const documents = await MonitorModel.find(query).sort(sort).skip(skip).limit(rowsPerPage);

		return this.mapDocuments(documents);
	};

	findByIds = async (monitorIds: string[]): Promise<Monitor[]> => {
		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const monitors = await MonitorModel.find({ _id: { $in: objectIds } });
		return this.mapDocuments(monitors);
	};

	findByIdsWithChecks = async (monitorIds: string[], checksCount: number = 25): Promise<MonitorWithChecks[]> => {
		if (!monitorIds.length) {
			return [];
		}

		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));

		const pipeline: PipelineStage[] = [
			{ $match: { _id: { $in: objectIds } } },
			{
				$lookup: {
					from: "checks",
					let: { monitorId: "$_id" },
					pipeline: [{ $match: { $expr: { $eq: ["$metadata.monitorId", "$$monitorId"] } } }, { $sort: { createdAt: -1 } }, { $limit: checksCount }],
					as: "checks",
				},
			},
			{
				$lookup: {
					from: "maintenancewindows",
					let: { monitorId: "$_id" },
					pipeline: [{ $match: { $expr: { $eq: ["$monitorId", "$$monitorId"] } } }],
					as: "maintenanceWindows",
				},
			},
			{
				$lookup: {
					from: "monitorstats",
					localField: "_id",
					foreignField: "monitorId",
					as: "stats",
				},
			},
			{
				$addFields: {
					isMaintenance: {
						$reduce: {
							input: "$maintenanceWindows",
							initialValue: false,
							in: {
								$or: [
									"$$value",
									{
										$and: [{ $eq: ["$$this.active", true] }, { $lte: ["$$this.start", "$$NOW"] }, { $gte: ["$$this.end", "$$NOW"] }],
									},
								],
							},
						},
					},
					uptimePercentage: { $arrayElemAt: ["$stats.uptimePercentage", 0] },
				},
			},
			{
				$project: {
					maintenanceWindows: 0,
					stats: 0,
				},
			},
		];

		const documents = await MonitorModel.aggregate(pipeline);
		return documents.map((doc) => this.toEntityWithChecks(doc));
	};

	findMonitorCountByTeamIdAndType = async (teamId: string, config?: TeamQueryConfig): Promise<number> => {
		const { type } = config ?? {};

		const query: FilterQuery<MonitorDocument> = {
			teamId: new mongoose.Types.ObjectId(teamId),
		};

		if (type !== undefined) {
			query.type = Array.isArray(type) ? { $in: type } : type;
		}

		const count = await MonitorModel.countDocuments(query);
		return count;
	};

	updateById = async (monitorId: string, teamId: string, patch: Partial<Monitor>) => {
		const updatedMonitor = await MonitorModel.findOneAndUpdate(
			{ _id: monitorId, teamId },
			{
				$set: {
					...patch,
				},
			},
			{ new: true, runValidators: true }
		);
		if (!updatedMonitor) {
			throw new AppError({ message: `Failed to update monitor with id ${monitorId}`, status: 500 });
		}
		return this.toEntity(updatedMonitor);
	};

	togglePauseById = async (monitorId: string, teamId: string) => {
		const monitor = await MonitorModel.findOneAndUpdate(
			{ _id: monitorId, teamId },
			[
				{
					$set: {
						isActive: { $not: "$isActive" },
						status: "$$REMOVE",
					},
				},
			],
			{ new: true }
		);
		if (!monitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found for the given team.`, status: 404 });
		}
		return this.toEntity(monitor);
	};

	deleteById = async (monitorId: string, teamId: string) => {
		const deletedMonitor = await MonitorModel.findOneAndDelete({ _id: monitorId, teamId });

		if (!deletedMonitor) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found for the given team.`, status: 404 });
		}

		return this.toEntity(deletedMonitor);
	};

	deleteByTeamId = async (teamId: string) => {
		const monitors = await MonitorModel.find({ teamId });
		const { deletedCount } = await MonitorModel.deleteMany({ teamId });

		return { monitors: this.mapDocuments(monitors), deletedCount };
	};

	findMonitorsSummaryByTeamId = async (teamId: string, config?: SummaryConfig): Promise<MonitorsSummary> => {
		const match: FilterQuery<MonitorDocument> = { teamId: new mongoose.Types.ObjectId(teamId) };
		if (config?.type !== undefined) {
			match.type = Array.isArray(config.type) ? { $in: config.type } : config.type;
		}
		const pipeline = [
			{ $match: match },
			{
				$group: {
					_id: null,
					totalMonitors: { $sum: 1 },
					upMonitors: {
						$sum: {
							$cond: [{ $eq: ["$status", true] }, 1, 0],
						},
					},
					downMonitors: {
						$sum: {
							$cond: [{ $eq: ["$status", false] }, 1, 0],
						},
					},
					pausedMonitors: {
						$sum: {
							$cond: [{ $eq: ["$isActive", false] }, 1, 0],
						},
					},
				},
			},
			{ $project: { _id: 0 } },
		];

		const [summary] = await MonitorModel.aggregate(pipeline);
		return summary ?? { totalMonitors: 0, upMonitors: 0, downMonitors: 0, pausedMonitors: 0 };
	};

	findGroupsByTeamId = async (teamId: string): Promise<string[]> => {
		const groups = await MonitorModel.distinct("group", {
			teamId: new mongoose.Types.ObjectId(teamId),
			group: { $nin: [null, ""] },
		});
		return groups.sort();
	};

	removeNotificationFromMonitors = async (notificationId: string): Promise<void> => {
		await MonitorModel.updateMany({ notifications: notificationId }, { $pull: { notifications: notificationId } });
	};

	private mapDocuments = (documents: MonitorDocument[]): Monitor[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};

	private toEntity = (doc: MonitorDocument): Monitor => {
		const toStringId = (value: unknown): string => {
			if (value instanceof mongoose.Types.ObjectId) {
				return value.toString();
			}
			return value?.toString() ?? "";
		};

		const toDateString = (value: Date | string): string => {
			return value instanceof Date ? value.toISOString() : value;
		};

		const notificationIds = (doc.notifications ?? []).map((notification) => toStringId(notification));

		return {
			id: toStringId(doc._id),
			userId: toStringId(doc.userId),
			teamId: toStringId(doc.teamId),
			name: doc.name,
			description: doc.description ?? undefined,
			status: doc.status ?? undefined,
			statusWindow: doc.statusWindow ?? [],
			statusWindowSize: doc.statusWindowSize,
			statusWindowThreshold: doc.statusWindowThreshold,
			type: doc.type,
			ignoreTlsErrors: doc.ignoreTlsErrors,
			jsonPath: doc.jsonPath ?? undefined,
			expectedValue: doc.expectedValue ?? undefined,
			matchMethod: doc.matchMethod ?? undefined,
			url: doc.url,
			port: doc.port ?? undefined,
			isActive: doc.isActive,
			interval: doc.interval,
			uptimePercentage: doc.uptimePercentage ?? undefined,
			notifications: notificationIds,
			secret: doc.secret ?? undefined,
			thresholds: doc.thresholds ?? undefined,
			alertThreshold: doc.alertThreshold,
			cpuAlertThreshold: doc.cpuAlertThreshold,
			memoryAlertThreshold: doc.memoryAlertThreshold,
			diskAlertThreshold: doc.diskAlertThreshold,
			tempAlertThreshold: doc.tempAlertThreshold,
			selectedDisks: doc.selectedDisks ?? [],
			gameId: doc.gameId ?? undefined,
			group: doc.group ?? null,
			recentChecks: (doc.recentChecks ?? []).map((check: any) => this.toCheckSnapshot(check)),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	private toEntityWithChecks = (doc: any): MonitorWithChecks => {
		const toStringId = (value: unknown): string => {
			if (value instanceof mongoose.Types.ObjectId) {
				return value.toString();
			}
			return value?.toString() ?? "";
		};

		const toDateString = (value: Date | string): string => {
			if (!value) return "";
			return value instanceof Date ? value.toISOString() : value;
		};

		const notificationIds = (doc.notifications ?? []).map((notification: unknown) => toStringId(notification));

		const checks: Check[] = (doc.checks ?? []).map((check: any) => ({
			id: toStringId(check._id),
			metadata: {
				monitorId: toStringId(check.metadata?.monitorId),
				teamId: toStringId(check.metadata?.teamId),
				type: check.metadata?.type,
			},
			status: check.status,
			responseTime: check.responseTime,
			timings: check.timings,
			statusCode: check.statusCode,
			message: check.message,
			ack: check.ack,
			ackAt: check.ackAt ?? null,
			expiry: toDateString(check.expiry),
			cpu: check.cpu,
			memory: check.memory,
			disk: check.disk,
			host: check.host,
			errors: check.errors,
			capture: check.capture,
			net: check.net,
			accessibility: check.accessibility,
			bestPractices: check.bestPractices,
			seo: check.seo,
			performance: check.performance,
			audits: check.audits,
			__v: check.__v,
			createdAt: toDateString(check.createdAt),
			updatedAt: toDateString(check.updatedAt),
		}));

		return {
			id: toStringId(doc._id),
			userId: toStringId(doc.userId),
			teamId: toStringId(doc.teamId),
			name: doc.name,
			description: doc.description ?? undefined,
			status: doc.status ?? undefined,
			statusWindow: doc.statusWindow ?? [],
			statusWindowSize: doc.statusWindowSize,
			statusWindowThreshold: doc.statusWindowThreshold,
			type: doc.type,
			ignoreTlsErrors: doc.ignoreTlsErrors,
			jsonPath: doc.jsonPath ?? undefined,
			expectedValue: doc.expectedValue ?? undefined,
			matchMethod: doc.matchMethod ?? undefined,
			url: doc.url,
			port: doc.port ?? undefined,
			isActive: doc.isActive,
			interval: doc.interval,
			uptimePercentage: doc.uptimePercentage ?? undefined,
			notifications: notificationIds,
			secret: doc.secret ?? undefined,
			thresholds: doc.thresholds ?? undefined,
			alertThreshold: doc.alertThreshold,
			cpuAlertThreshold: doc.cpuAlertThreshold,
			memoryAlertThreshold: doc.memoryAlertThreshold,
			diskAlertThreshold: doc.diskAlertThreshold,
			tempAlertThreshold: doc.tempAlertThreshold,
			selectedDisks: doc.selectedDisks ?? [],
			gameId: doc.gameId ?? undefined,
			group: doc.group ?? null,
			recentChecks: (doc.recentChecks ?? []).map((check: any) => this.toCheckSnapshot(check)),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
			checks,
		};
	};

	private toCheckSnapshot = (doc: CheckSnapshotDocument): CheckSnapshot => {
		const toDateString = (value: Date | string): string => {
			return value instanceof Date ? value.toISOString() : value;
		};

		return {
			id: doc.id,
			status: doc.status,
			responseTime: doc.responseTime,
			timings: doc.timings,
			statusCode: doc.statusCode,
			message: doc.message,
			cpu: doc.cpu,
			memory: doc.memory,
			disk: doc.disk,
			host: doc.host,
			errors: doc.errors,
			capture: doc.capture,
			net: doc.net,
			accessibility: doc.accessibility,
			bestPractices: doc.bestPractices,
			seo: doc.seo,
			performance: doc.performance,
			audits: doc.audits,
			createdAt: toDateString(doc.createdAt),
		};
	};
}

export default MongoMonitorsRepository;
