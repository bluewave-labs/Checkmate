import mongoose from "mongoose";

import { IStatusPage, StatusPage, Monitor, Check } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import type { UserContext } from "@/types/domain/index.js";
const SERVICE_NAME = "StatusPageService";

export interface IStatusPageService {
  create: (
    tokenizedUser: UserContext,
    statusPage: IStatusPage
  ) => Promise<IStatusPage>;
  getAll: (
    teamId: string,
    page: number,
    rowsPerPage: number
  ) => Promise<{ statusPages: IStatusPage[]; count: number }>;
  get: (
    teamId: string,
    id: string
  ) => Promise<{ statusPage: IStatusPage; checksMap: Record<string, any[]> }>;
  getPublic: (
    url: string
  ) => Promise<{ statusPage: IStatusPage; checksMap: Record<string, any[]> }>;
  update: (
    teamId: string,
    tokenizedUser: UserContext,
    id: string,
    updateData: Partial<IStatusPage>
  ) => Promise<IStatusPage>;
  delete: (teamId: string, id: string) => Promise<boolean>;
}

class StatusPageService implements IStatusPageService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  create = async (userContext: UserContext, statusPageData: IStatusPage) => {
    const monitorIds = statusPageData.monitors || [];
    const count = await Monitor.countDocuments({
      _id: { $in: monitorIds },
      teamId: userContext.currentTeamId,
    });

    if (count !== monitorIds.length) {
      throw new ApiError(
        "One or more monitors do not belong to the current team",
        403
      );
    }

    const data: IStatusPage = {
      ...statusPageData,
      orgId: new mongoose.Types.ObjectId(userContext.orgId),
      teamId: new mongoose.Types.ObjectId(userContext.currentTeamId),
      createdBy: new mongoose.Types.ObjectId(userContext.sub),
      updatedBy: new mongoose.Types.ObjectId(userContext.sub),
    };

    const statusPage = await StatusPage.create(data);
    return statusPage;
  };

  get = async (teamId: string, id: string) => {
    const statusPage = await StatusPage.findOne({ _id: id, teamId }).populate(
      "monitors"
    );
    if (!statusPage) {
      throw new ApiError("Status page not found", 404);
    }

    const monitorIds = (statusPage.monitors || []).map((m) => m._id);

    const checks = await Check.aggregate([
      { $match: { "metadata.monitorId": { $in: monitorIds } } },
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

    const checksMap = new Map(
      checks.map((c: any) => [c._id.toString(), c.latestChecks])
    );
    return {
      statusPage,
      checksMap: Object.fromEntries(checksMap),
    };
  };

  getPublic = async (url: string) => {
    const statusPage = await StatusPage.findOne({
      url,
      isPublished: true,
    }).populate("monitors");
    if (!statusPage) {
      throw new ApiError("Public status page not found", 404);
    }
    const monitorIds = (statusPage.monitors || []).map((m) => m._id);

    const checks = await Check.aggregate([
      { $match: { "metadata.monitorId": { $in: monitorIds } } },
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

    const checksMap = new Map(
      checks.map((c: any) => [c._id.toString(), c.latestChecks])
    );
    return {
      statusPage,
      checksMap: Object.fromEntries(checksMap),
    };
  };

  getAll = async (teamId: string, page: number, rowsPerPage: number) => {
    const count = await StatusPage.countDocuments({ teamId });
    const statusPages = await StatusPage.find({ teamId })
      .skip(page * rowsPerPage)
      .limit(rowsPerPage);

    return { statusPages, count };
  };

  update = async (
    teamId: string,
    userContext: UserContext,
    id: string,
    updateData: Partial<IStatusPage>
  ) => {
    const monitorIds = updateData.monitors || [];
    const count = await Monitor.countDocuments({
      _id: { $in: monitorIds },
      teamId: userContext.currentTeamId,
    });

    if (count !== monitorIds.length) {
      throw new ApiError(
        "One or more monitors do not belong to the current team",
        403
      );
    }

    const updatedStatusPage = await StatusPage.findOneAndUpdate(
      { _id: id, teamId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
          updatedBy: userContext.sub,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedStatusPage) {
      throw new ApiError("Failed to update status page", 500);
    }

    return updatedStatusPage;
  };

  delete = async (teamId: string, id: string) => {
    const result = await StatusPage.deleteOne({ _id: id, teamId });
    if (!result.deletedCount) {
      throw new ApiError("Status page not found", 404);
    }

    return result.deletedCount === 1;
  };
}

export default StatusPageService;
