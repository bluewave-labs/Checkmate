import {
  Monitor,
  IUserContext,
  IMaintenance,
  Maintenance,
  MaintenanceRepeats,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "MaintenanceService";
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export interface IMaintenanceService {
  create: (
    userContext: IUserContext,
    maintenance: IMaintenance
  ) => Promise<IMaintenance>;
  getAll: (teamId: string) => Promise<IMaintenance[]>;
  get: (teamId: string, id: string) => Promise<IMaintenance>;
  toggleActive: (
    teamId: string,
    userContext: IUserContext,
    id: string
  ) => Promise<IMaintenance>;
  update: (
    teamId: string,
    userContext: IUserContext,
    id: string,
    updateData: Partial<IMaintenance>
  ) => Promise<IMaintenance>;
  delete: (teamId: string, id: string) => Promise<boolean>;
  isInMaintenance: (monitorId: string) => Promise<boolean>;
}

type MaintenanceCache = Map<string, IMaintenance[]>;

class MaintenanceService implements IMaintenanceService {
  public SERVICE_NAME: string;
  private maintenanceCache: MaintenanceCache;
  private lastRefresh: number;
  private CACHE_TTL_MS = 60 * 1000;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.maintenanceCache = new Map();
    this.lastRefresh = 0;
  }

  create = async (userContext: IUserContext, maintenanceData: IMaintenance) => {
    // Make sure monitors belong to current team
    const monitorIds = maintenanceData.monitors || [];
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

    const maintenance = await Maintenance.create({
      ...maintenanceData,
      orgId: userContext.orgId,
      teamId: userContext.currentTeamId,
      createdBy: userContext.sub,
      updatedBy: userContext.sub,
    });
    return maintenance;
  };

  get = async (teamId: string, id: string) => {
    const maintenance = await Maintenance.findOne({ _id: id, teamId });
    if (!maintenance) {
      throw new ApiError("Maintenance not found", 404);
    }
    return maintenance;
  };

  getAll = async (teamId: string) => {
    return Maintenance.find({ teamId });
  };

  toggleActive = async (
    teamId: string,
    userContext: IUserContext,
    id: string
  ) => {
    const updatedMaintenance = await Maintenance.findOneAndUpdate(
      { _id: id, teamId },
      [
        {
          $set: {
            isActive: { $not: "$isActive" },
            updatedBy: userContext.sub,
            updatedAt: new Date(),
          },
        },
      ],
      { new: true }
    );
    if (!updatedMaintenance) {
      throw new ApiError("Maintenance not found", 404);
    }
    return updatedMaintenance;
  };

  update = async (
    teamId: string,
    userContext: IUserContext,
    id: string,
    updateData: Partial<IMaintenance>
  ) => {
    // Make sure monitors belong to current team
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

    const allowedFields: (keyof IMaintenance)[] = [
      "name",
      "monitors",
      "repeat",
      "startTime",
      "endTime",
      "isActive",
    ];
    const safeUpdate: Partial<IMaintenance> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (safeUpdate as any)[field] = updateData[field];
      }
    }

    const updatedMaintenance = await Maintenance.findOneAndUpdate(
      { _id: id, teamId },
      {
        $set: {
          ...safeUpdate,
          updatedAt: new Date(),
          updatedBy: userContext.sub,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedMaintenance) {
      throw new ApiError("Failed to update maintenance", 500);
    }

    return updatedMaintenance;
  };

  delete = async (teamId: string, id: string) => {
    const result = await Maintenance.deleteOne({ _id: id, teamId });
    if (!result.deletedCount) {
      throw new ApiError("Maintenance not found", 404);
    }
    return result.deletedCount === 1;
  };

  private refreshCache = async () => {
    const now = new Date();

    const activeMaintenances = await Maintenance.find({
      isActive: true,
      $or: [
        { repeat: { $in: MaintenanceRepeats } },
        { startTime: { $lte: now }, endTime: { $gte: now } },
      ],
    }).lean();

    // Reset cache
    const newCache = new Map();

    for (const m of activeMaintenances) {
      for (const monitorId of m.monitors) {
        const key = monitorId.toString();
        if (!newCache.has(key)) newCache.set(key, []);
        newCache.get(key)!.push(m);
      }
    }

    this.maintenanceCache = newCache;
    this.lastRefresh = Date.now();
  };

  isInMaintenance = async (monitorId: string) => {
    const now = Date.now();

    if (now - this.lastRefresh > this.CACHE_TTL_MS) {
      await this.refreshCache();
    }

    const maintenances = this.maintenanceCache.get(monitorId) || [];

    for (const m of maintenances) {
      const start = m.startTime.getTime();
      const end = m.endTime.getTime();
      const duration = end - start;

      let isActiveNow = false;
      if (!m.repeat || m.repeat === "no repeat") {
        isActiveNow = start <= now && now <= end;
      } else {
        const elapsed = now - start;
        if (elapsed >= 0) {
          const period = m.repeat === "daily" ? DAY_MS : WEEK_MS;
          const offset = elapsed % period;
          if (offset < duration) {
            isActiveNow = true;
          }
        }
      }
      if (isActiveNow) {
        return true;
      }
    }

    return false;
  };
}

export default MaintenanceService;
