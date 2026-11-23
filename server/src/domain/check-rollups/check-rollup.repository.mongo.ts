import mongoose from "mongoose";
import { CheckModel } from "@/domain/checks/check.model.js";
import { CheckRollupModel } from "@/domain/check-rollups/check-rollup.model.js";
import { buildCoreRollupStages, buildRollupMergeStage } from "@/domain/check-rollups/check-rollup.pipeline.js";
import type { ICheckRollupsRepository } from "@/domain/check-rollups/check-rollup.repository.interface.js";

const SERVICE_NAME = "CheckRollupsRepository";

class MongoCheckRollupsRepository implements ICheckRollupsRepository {
	static SERVICE_NAME = SERVICE_NAME;

	rollUp = async (from: Date, to: Date): Promise<void> => {
		await CheckModel.aggregate([...buildCoreRollupStages(from, to), buildRollupMergeStage(CheckRollupModel.collection.collectionName)]);
	};

	findLatestBucketStart = async (): Promise<Date | null> => {
		const latest = await CheckRollupModel.findOne().sort({ bucketStart: -1 }).select({ bucketStart: 1 }).lean();
		return latest?.bucketStart ?? null;
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
}

export default MongoCheckRollupsRepository;
