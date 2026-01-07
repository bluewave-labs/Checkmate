import {
  IMonitorRepository,
  IMaintenanceRepository,
} from "@/repositories/index.js";
import ApiError from "@/utils/ApiError.js";
import { UserContext, Maintenance } from "@/types/domain/index.js";

const SERVICE_NAME = "MaintenanceService";
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export interface IMaintenanceService {
  create: (
    userContext: UserContext,
    maintenance: Maintenance
  ) => Promise<Maintenance>;
  get: (teamId: string, id: string) => Promise<Maintenance>;
  getAll: (teamId: string) => Promise<Maintenance[]>;
  toggleActive: (
    teamId: string,
    userContext: UserContext,
    id: string
  ) => Promise<Maintenance>;
  update: (
    teamId: string,
    userContext: UserContext,
    id: string,
    updateData: Partial<Maintenance>
  ) => Promise<Maintenance>;
  delete: (teamId: string, id: string) => Promise<boolean>;
  isInMaintenance: (monitorId: string) => Promise<boolean>;
}

type MaintenanceCache = Map<string, Maintenance[]>;

class MaintenanceService implements IMaintenanceService {
  public SERVICE_NAME: string;
  private maintenanceCache: MaintenanceCache;
  private lastRefresh: number;
  private CACHE_TTL_MS = 60 * 1000;

  // Repositories
  private maintenanceRepository: IMaintenanceRepository;
  private monitorRepository: IMonitorRepository;
  constructor(
    maintenanceRepository: IMaintenanceRepository,
    monitorRepository: IMonitorRepository
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.maintenanceCache = new Map();
    this.lastRefresh = 0;
    this.monitorRepository = monitorRepository;
    this.maintenanceRepository = maintenanceRepository;
  }

  create = async (userContext: UserContext, maintenanceData: Maintenance) => {
    // Make sure monitors belong to current team
    const monitorIds = maintenanceData.monitors || [];
    const count = await this.monitorRepository.countByIdAndTeamId(
      monitorIds,
      userContext.currentTeamId || ""
    );

    if (count !== monitorIds.length) {
      throw new ApiError(
        "One or more monitors do not belong to the current team",
        403
      );
    }

    const maintenance = await this.maintenanceRepository.create({
      ...maintenanceData,
      orgId: userContext.orgId,
      teamId: userContext.currentTeamId,
      createdBy: userContext.sub,
      updatedBy: userContext.sub,
    });
    return maintenance;
  };

  get = async (teamId: string, id: string) => {
    const maintenance = await this.maintenanceRepository.findById(id, teamId);
    if (!maintenance) {
      throw new ApiError("Maintenance not found", 404);
    }
    return maintenance;
  };

  getAll = async (teamId: string) => {
    return this.maintenanceRepository.findByTeamId(teamId);
  };

  toggleActive = async (
    teamId: string,
    userContext: UserContext,
    id: string
  ) => {
    const updatedMaintenance = await this.maintenanceRepository.updateById(
      id,
      teamId,
      {
        isActive: { $not: "$isActive" },
        updatedBy: userContext.sub,
        updatedAt: new Date(),
      }
    );
    if (!updatedMaintenance) {
      throw new ApiError("Maintenance not found", 404);
    }
    return updatedMaintenance;
  };

  update = async (
    teamId: string,
    userContext: UserContext,
    id: string,
    updateData: Partial<Maintenance>
  ) => {
    // Make sure monitors belong to current team
    const monitorIds = updateData.monitors || [];
    const count = await this.monitorRepository.countByIdAndTeamId(
      monitorIds,
      userContext.currentTeamId || ""
    );

    if (count !== monitorIds.length) {
      throw new ApiError(
        "One or more monitors do not belong to the current team",
        403
      );
    }

    const allowedFields: (keyof Maintenance)[] = [
      "name",
      "monitors",
      "repeat",
      "startTime",
      "endTime",
      "isActive",
    ];
    const safeUpdate: Partial<Maintenance> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (safeUpdate as any)[field] = updateData[field];
      }
    }

    const updatedMaintenance = await this.maintenanceRepository.updateById(
      id,
      teamId,
      {
        ...safeUpdate,
        updatedAt: new Date(),
        updatedBy: userContext.sub,
      }
    );
    if (!updatedMaintenance) {
      throw new ApiError("Failed to update maintenance", 500);
    }

    return updatedMaintenance;
  };

  delete = async (teamId: string, id: string) => {
    const didDelete = await this.maintenanceRepository.deleteById(id, teamId);
    if (!didDelete) {
      throw new ApiError("Maintenance not found", 404);
    }
    return didDelete;
  };

  private refreshCache = async () => {
    const activeMaintenances = await this.maintenanceRepository.findActive();

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
