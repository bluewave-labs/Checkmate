import { DLQItemModel } from "@/db/models/index.js";
import type { DLQItemDocument } from "@/db/models/DLQItem.js";
import type { DLQItem } from "@/types/index.js";
import type { IDLQRepository, DLQQueryFilters, DLQStatusCount } from "@/repositories/dlq/IDLQRepository.js";
import mongoose from "mongoose";
import { AppError } from "@/utils/AppError.js";

class MongoDLQRepository implements IDLQRepository {
	private toStringId = (value?: mongoose.Types.ObjectId | string | null): string => {
		if (!value) {
			return "";
		}
		return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
	};

	private toDateString = (value?: Date | string | null): string => {
		if (!value) {
			return new Date(0).toISOString();
		}
		return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
	};

	protected toEntity = (doc: DLQItemDocument): DLQItem => {
		return {
			id: this.toStringId(doc._id),
			type: doc.type,
			status: doc.status,
			payload: doc.payload,
			monitorId: this.toStringId(doc.monitorId),
			teamId: this.toStringId(doc.teamId),
			retryCount: doc.retryCount,
			maxRetries: doc.maxRetries,
			lastError: doc.lastError,
			nextRetryAt: this.toDateString(doc.nextRetryAt),
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
		};
	};

	protected mapDocuments = (documents: DLQItemDocument[] | DLQItemDocument | null): DLQItem[] => {
		if (!documents) {
			return [];
		}
		if (Array.isArray(documents)) {
			return documents.map((doc) => this.toEntity(doc));
		}
		return [this.toEntity(documents)];
	};

	async create(item: Partial<DLQItem>): Promise<DLQItem> {
		const newItem = await DLQItemModel.create(item);
		return this.toEntity(newItem);
	}

	findById = async (id: string): Promise<DLQItem | null> => {
		const item = await DLQItemModel.findById(new mongoose.Types.ObjectId(id));
		return item ? this.toEntity(item) : null;
	};

	findByTeamId = async (teamId: string, filters: DLQQueryFilters): Promise<DLQItem[]> => {
		const query: Record<string, unknown> = {
			teamId: new mongoose.Types.ObjectId(teamId),
		};
		if (filters.type) {
			query.type = filters.type;
		}
		if (filters.status) {
			query.status = filters.status;
		}

		const items = await DLQItemModel.find(query)
			.sort({ createdAt: -1 })
			.skip(filters.page * filters.rowsPerPage)
			.limit(filters.rowsPerPage);
		return this.mapDocuments(items);
	};

	findRetryable = async (limit: number): Promise<DLQItem[]> => {
		const items = await DLQItemModel.find({
			status: { $in: ["pending", "retrying"] },
			nextRetryAt: { $lte: new Date() },
		})
			.sort({ nextRetryAt: 1 })
			.limit(limit);
		return this.mapDocuments(items);
	};

	countByTeamId = async (teamId: string): Promise<number> => {
		return DLQItemModel.countDocuments({
			teamId: new mongoose.Types.ObjectId(teamId),
		});
	};

	countByTeamIdGrouped = async (teamId: string): Promise<DLQStatusCount[]> => {
		const results = await DLQItemModel.aggregate([
			{ $match: { teamId: new mongoose.Types.ObjectId(teamId) } },
			{
				$group: {
					_id: { status: "$status", type: "$type" },
					count: { $sum: 1 },
				},
			},
		]);
		return results.map((r) => ({
			status: r._id.status,
			type: r._id.type,
			count: r.count,
		}));
	};

	updateById = async (id: string, patch: Partial<DLQItem>): Promise<DLQItem> => {
		const updated = await DLQItemModel.findOneAndUpdate(
			{ _id: new mongoose.Types.ObjectId(id) },
			{ $set: { ...patch } },
			{ new: true, runValidators: true }
		);
		if (!updated) {
			throw new AppError({ message: `DLQ item with id ${id} not found`, status: 404 });
		}
		return this.toEntity(updated);
	};

	deleteById = async (id: string, teamId: string): Promise<number> => {
		const result = await DLQItemModel.deleteOne({
			_id: new mongoose.Types.ObjectId(id),
			teamId: new mongoose.Types.ObjectId(teamId),
		});
		return result.deletedCount || 0;
	};

	deleteOlderThan = async (date: Date): Promise<number> => {
		const result = await DLQItemModel.deleteMany({
			createdAt: { $lt: date },
		});
		return result.deletedCount || 0;
	};
}

export default MongoDLQRepository;
