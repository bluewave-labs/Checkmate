import type { IChecksRepository } from "@/repositories/index.js";
import { CheckEntity } from "@/types/domain/check.js";
import type { ICheck } from "@/db/models/index.js";
import { Check } from "@/db/models/index.js";
import mongoose from "mongoose";

export type LatestChecksByMonitor = Array<{
  id: string;
  latestChecks: CheckEntity[];
}>;

class MongoCheckRepository implements IChecksRepository {
  private toEntity = (check: ICheck): CheckEntity => {
    const entity: CheckEntity = {
      id: check._id.toString(),
      monitorId: check.metadata.monitorId.toString(),
      teamId: check.metadata.teamId.toString(),
      type: check.metadata.type,
      status: check.status,
      httpStatusCode: check.httpStatusCode,
      message: check.message,
      responseTime: check.responseTime,
      timings: check.timings,
      errorMessage: check.errorMessage,
      ackAt: check.ackAt,
      ackBy: check.ackBy?.toString(),
      system: check.system,
      capture: check.capture,
      lighthouse: check.lighthouse,
      dockerContainers: check.dockerContainers,
      createdAt: check.createdAt,
      updatedAt: check.updatedAt,
      expiry: check.expiry,
    };

    return entity;
  };

  findLatestChecksByMonitorIds = async (monitorIds: string[]) => {
    const mongoIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
    const checkMap = await Check.aggregate([
      {
        $match: {
          "metadata.monitorId": { $in: mongoIds },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$metadata.monitorId",
          latestChecks: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          latestChecks: { $slice: [{ $ifNull: ["$latestChecks", []] }, 25] },
        },
      },
    ]);
    return checkMap.map((cm) => {
      return { id: cm._id, latestChecks: cm.latestChecks };
    });
  };
}

export default MongoCheckRepository;
