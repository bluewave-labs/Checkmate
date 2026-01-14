import { MonitorModel } from "@/db/models/index.js";
import type { MonitorDocument } from "@/db/models/Monitor.js";
import type { Monitor, MonitorType } from "@/types/monitor.js";
import mongoose, { type FilterQuery } from "mongoose";
import type { IMonitorsRepository, TeamQueryConfig } from "./IMonitorsRepository.js";
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

	findById = async (monitorId: string, teamId?: string): Promise<Monitor> => {
		const match: { _id: string; teamId?: string } = { _id: monitorId };
		if (teamId) {
			match.teamId = teamId;
		}
		const monitor = await MonitorModel.findOne(match);
		if (!monitor) {
			if (monitor === null || monitor === undefined) {
				throw new AppError({
					message: `Monitor with ID ${monitorId} not found.`,
					status: 404,
				});
			}
		}
		return this.toEntity(monitor);
	};

	findAll = async (): Promise<Monitor[]> => {
		const monitors = await MonitorModel.find();
		return this.mapDocuments(monitors);
	};

	findByTeamId = async (teamId: string, config: TeamQueryConfig): Promise<Monitor[] | null> => {
		const { page = 0, rowsPerPage = 25, filter, field = "createdAt", order = "desc", type, limit } = config ?? {};

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
		const limitValue = limit ?? rowsPerPage;

		const documents = await MonitorModel.find(query).sort(sort).skip(skip).limit(limitValue).exec();

		return this.mapDocuments(documents);
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

	update = async (monitorId: string, patch: Partial<Monitor>) => {
		const updatedMonitor = await MonitorModel.findOneAndUpdate(
			{ _id: monitorId },
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

	deleteByTeamId = async (teamId: string) => {
		const monitors = await MonitorModel.find({ teamId });
		const { deletedCount } = await MonitorModel.deleteMany({ teamId });

		return { monitors: this.mapDocuments(monitors), deletedCount };
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
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};
}

export default MongoMonitorsRepository;
