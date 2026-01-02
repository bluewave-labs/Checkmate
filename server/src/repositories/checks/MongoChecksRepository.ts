import { Check } from "@/db/models/index.js";
import type { ICheck } from "@/db/models/index.js";
import type { IChecksRepository } from "@/repositories/checks/IChecksRepository.js";
import { CheckEntity } from "@/types/domain/check.js";
import mongoose from "mongoose";

export class MongoChecksRepository implements IChecksRepository {
  private toEntity = (check: ICheck): CheckEntity => {
    return {
      id: check._id.toString(),
      metadata: {
        monitorId: check.metadata.monitorId.toString(),
        teamId: check.metadata.teamId.toString(),
        type: check.metadata.type,
      },
      status: check.status,
      httpStatusCode: check.httpStatusCode,
      message: check.message,
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
  };

  findLatestByMonitorIds = async (monitorIds: string[]) => {
    const checks = await Check.aggregate([
      {
        $match: {
          "metadata.monitorId": {
            $in: monitorIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
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
    console.log(checks);
    return checks;
  };
}
