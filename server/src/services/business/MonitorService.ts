import ApiError from "@/utils/ApiError.js";
import { IJobQueue } from "@/services/infrastructure/JobQueue.js";
import { MonitorWithChecksResponse } from "@/types/index.js";
import { MonitorStatus } from "@/types/domain/index.js";
import { Entitlements } from "@/types/entitlements.js";
import { getStartDate } from "@/utils/TimeUtils.js";
import {
  IMonitorRepository,
  IChecksRepository,
  IMonitorStatsRepository,
} from "@/repositories/index.js";
import type { Monitor, MonitorType } from "@/types/domain/index.js";

export enum MonitorImportCode {
  OK = "OK",
  PARTIAL = "PARTIAL",
  NO_CAPACITY = "NO_CAPACITY",
  UNEXPECTED = "UNEXPECTED",
}

export interface MonitorImportResult {
  ok: boolean;
  status: number;
  code: MonitorImportCode;
  attempted: number;
  eligible: number;
  imported: number;
  errors: number;
  message?: string;
}

const SERVICE_NAME = "MonitorService";

export interface IMonitorService {
  create: (
    orgId: string,
    userId: string,
    currentTeamId: string,
    monitorData: Monitor
  ) => Promise<Monitor>;
  getAll: (teamId: string) => Promise<Monitor[]>;
  getAllEmbedChecks: (
    teamId: string,
    search: string,
    sortField: string,
    sortOrder: string,
    page: number,
    limit: number,
    type: MonitorType[],
    status: MonitorStatus[]
  ) => Promise<{
    count: number;
    upCount: number;
    downCount: number;
    pausedCount: number;
    monitors: any[];
  }>;
  get: (teamId: string, monitorId: string) => Promise<Monitor>;
  getEmbedChecks: (
    teamId: string,
    monitorId: string,
    range: string
  ) => Promise<MonitorWithChecksResponse>;
  togglePause: (
    userId: string,
    teamId: string,
    monitorId: string
  ) => Promise<Monitor>;
  update: (
    userId: string,
    teamId: string,
    monitorId: string,
    updateData: Partial<Monitor>
  ) => Promise<Monitor>;
  delete: (teamId: string, monitorId: string) => Promise<boolean>;
  deleteAllInOrg: (orgId: string) => Promise<boolean>;
  export: (teamId: string) => Promise<Array<Record<string, unknown>>>;
  import: (
    orgId: string,
    teamId: string,
    userId: string,
    entitlements: Entitlements,
    data: { monitors: Array<Monitor> }
  ) => Promise<MonitorImportResult>;
}

class MonitorService implements IMonitorService {
  public SERVICE_NAME: string;
  private jobQueue: IJobQueue;
  private monitorRepository: IMonitorRepository;
  private checksRepository: IChecksRepository;
  private monitorStatsRepository: IMonitorStatsRepository;
  constructor(
    jobQueue: IJobQueue,
    monitorRepository: IMonitorRepository,
    checksRepository: IChecksRepository,
    monitorStatsRepository: IMonitorStatsRepository
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.jobQueue = jobQueue;
    this.monitorRepository = monitorRepository;
    this.checksRepository = checksRepository;
    this.monitorStatsRepository = monitorStatsRepository;
  }

  create = async (
    orgId: string,
    userId: string,
    currentTeamId: string,
    monitorData: Monitor
  ) => {
    const monitor = await this.monitorRepository.create(
      orgId,
      userId,
      currentTeamId,
      monitorData
    );
    await this.monitorStatsRepository.create({
      monitorId: monitor.id,
      currentStreakStartedAt: Date.now(),
    });
    await this.jobQueue.addJob(monitor);
    return monitor;
  };

  getAll = async (teamId: string) => {
    return await this.monitorRepository.findByTeamId(teamId);
  };

  getAllEmbedChecks = async (
    teamId: string,
    search: string,
    sortField: string,
    sortOrder: string,
    page: number,
    rowsPerPage: number,
    type: MonitorType[] = [],
    status: MonitorStatus[] = []
  ) => {
    const counts = await this.monitorRepository.findMonitorCountsByTeamId(
      teamId
    );

    const monitors = await this.monitorRepository.findByTeamIdWithConfig(
      teamId,
      {
        search,
        sortField,
        sortOrder,
        page,
        rowsPerPage,
        type,
        status,
      }
    );

    const checks = await this.checksRepository.findLatestChecksByMonitorIds(
      monitors.map((m) => m.id)
    );

    const checksMap = new Map(checks.map((c: any) => [c.id, c.latestChecks]));

    return {
      count: counts.total,
      upCount: counts.upCount,
      downCount: counts.downCount,
      pausedCount: counts.pausedCount,
      monitors,
      checksMap: Object.fromEntries(checksMap),
    };
  };

  get = async (teamId: string, monitorId: string) => {
    const monitor = await this.monitorRepository.findById(monitorId, teamId);
    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }
    return monitor;
  };

  getEmbedChecks = async (
    teamId: string,
    monitorId: string,
    range: string
  ): Promise<MonitorWithChecksResponse> => {
    const monitor = await this.monitorRepository.findById(monitorId, teamId);
    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }

    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }

    const stats = await this.monitorStatsRepository.findByMonitorId(monitor.id);

    const startDate = getStartDate(range);

    if (range === "24h" || range === "7d" || range === "30d") {
      const checks = await this.checksRepository.findDateRangeChecksByMonitor(
        monitor,
        startDate,
        range
      );

      return {
        checks,
        monitor,
        stats: (stats as any) || undefined,
      };
    } else {
      const checks = await this.checksRepository.findRecentChecksByMonitor(
        monitor,
        startDate
      );

      return {
        checks,
        monitor,
        stats: (stats as any) || undefined,
      };
    }
  };

  async togglePause(userId: string, teamId: string, id: string) {
    const updatedMonitor = await this.monitorRepository.togglePauseById(
      id,
      teamId,
      userId
    );

    if (!updatedMonitor) {
      throw new ApiError("Monitor not found", 404);
    }

    await this.jobQueue.updateJob(updatedMonitor);

    if (updatedMonitor?.status !== "paused") {
      await this.jobQueue.resumeJob(updatedMonitor);
    } else {
      await this.jobQueue.pauseJob(updatedMonitor);
    }
    return updatedMonitor;
  }

  async update(
    userId: string,
    teamId: string,
    monitorId: string,
    updateData: Partial<Monitor>
  ) {
    const allowedFields: (keyof Monitor)[] = [
      "name",
      "secret",
      "interval",
      "rejectUnauthorized",
      "n",
      "notificationChannels",
      "thresholds",
    ];
    const safeUpdate: Partial<Monitor> = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (safeUpdate as any)[field] = updateData[field];
      }
    }

    const updatedMonitor = await this.monitorRepository.updateById(
      monitorId,
      teamId,
      userId,
      safeUpdate
    );

    if (!updatedMonitor) {
      throw new ApiError("Monitor not found", 404);
    }
    await this.jobQueue.updateJob(updatedMonitor);
    return updatedMonitor;
  }

  async delete(teamId: string, monitorId: string) {
    const monitor = await this.monitorRepository.findById(monitorId, teamId);
    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }
    const deleted = await this.jobQueue.deleteJob(monitor);
    if (!deleted) {
      throw new ApiError("Failed to delete monitor job from queue", 500);
    }
    await this.monitorRepository.deleteById(monitorId, teamId);
    return true;
  }

  async deleteAllInOrg(orgId: string) {
    const montiors = await this.monitorRepository.findByOrgId(orgId);
    for (const monitor of montiors) {
      await this.jobQueue.deleteJob(monitor);
    }
    return await this.monitorRepository.deleteByOrgId(orgId);
  }

  export = async (teamId: string) => {
    const monitor = await this.monitorRepository.findByTeamId(teamId);
    return monitor.map((m) => ({
      name: m.name,
      url: m.url,
      port: m.port,
      type: m.type,
      interval: m.interval,
      n: m.n,
      secret: m.secret,
    }));
  };

  import = async (
    orgId: string,
    teamId: string,
    userId: string,
    entitlements: Entitlements,
    data: { monitors: Array<Monitor> }
  ) => {
    const attempted = data.monitors.length ?? 0;
    let result: Monitor[] = [];
    let canImport = 0;
    try {
      // Get current count
      const monitorCount = await this.monitorRepository.countByOrgId(orgId);

      // Check limits, return NO_CAPACITY if at limit
      if (monitorCount >= entitlements.monitorsMax) {
        return {
          ok: true,
          status: 200,
          attempted,
          code: MonitorImportCode.NO_CAPACITY,
          eligible: 0,
          imported: 0,
          errors: attempted,
        };
      }

      // Proceed with import
      canImport = entitlements.monitorsMax - monitorCount;
      const importableMonitors = data?.monitors.slice(0, canImport);

      result = await this.monitorRepository.createMany(
        userId,
        orgId,
        teamId,
        importableMonitors
      );

      for (const monitor of result) {
        await this.jobQueue.addJob(monitor);
      }
    } catch (error: any) {
      return {
        ok: false,
        status: 500,
        code: MonitorImportCode.UNEXPECTED,
        attempted,
        eligible: canImport,
        imported: result.length,
        errors: Math.max(0, attempted - result.length),
        message: error.message,
      };
    }

    const imported = result.length;
    const errors = Math.max(0, attempted - imported);
    const code =
      imported === attempted ? MonitorImportCode.OK : MonitorImportCode.PARTIAL;
    const status = imported === attempted ? 200 : 207;
    return {
      ok: true,
      status,
      code,
      attempted,
      eligible: canImport,
      imported,
      errors,
    };
  };
}

export default MonitorService;
