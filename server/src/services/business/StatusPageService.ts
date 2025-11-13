import mongoose from "mongoose";

import {
  IUserContext,
  IStatusPage,
  StatusPage,
  Monitor,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "StatusPageService";

export interface IStatusPageService {
  create: (
    tokenizedUser: IUserContext,
    statusPage: IStatusPage
  ) => Promise<IStatusPage>;
  getAll: (teamId: string) => Promise<IStatusPage[]>;
  get: (teamId: string, id: string) => Promise<IStatusPage>;
  getPublic: (url: string) => Promise<IStatusPage>;
  update: (
    teamId: string,
    tokenizedUser: IUserContext,
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

  create = async (userContext: IUserContext, statusPageData: IStatusPage) => {
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
    return statusPage;
  };

  getPublic = async (url: string) => {
    const statusPage = await StatusPage.findOne({
      url,
      isPublished: true,
    }).populate("monitors");
    if (!statusPage) {
      throw new ApiError("Public status page not found", 404);
    }
    return statusPage;
  };

  getAll = async (teamId: string) => {
    return StatusPage.find({ teamId });
  };

  update = async (
    teamId: string,
    userContext: IUserContext,
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
