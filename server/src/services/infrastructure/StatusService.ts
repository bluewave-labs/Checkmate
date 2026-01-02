import {
  IMonitor,
  IMonitorStats,
  MonitorStats,
  ICheck,
} from "@/db/models/index.js";
import { StatusResponse } from "./NetworkService.js";
import { IMonitorRepository } from "@/repositories/index.js";
import type { Monitor as MonitorEntity } from "@/types/domain/index.js";
import ApiError from "@/utils/ApiError.js";
// Using compact latestStatuses on Monitor for transition checks

const emptyMetrics = (): ThresholdEvaluationResult["metrics"] => ({
  cpu: { breached: false },
  memory: { breached: false },
  disk: { breached: false },
  temperature: { breached: false },
});

export interface ThresholdMetricEvaluation {
  value?: number;
  threshold?: number;
  breached: boolean;
}

export interface ThresholdEvaluationResult {
  hasBreach: boolean;
  notes: string[];
  metrics: {
    cpu: ThresholdMetricEvaluation;
    memory: ThresholdMetricEvaluation;
    disk: ThresholdMetricEvaluation;
    temperature: ThresholdMetricEvaluation;
  };
}

const SERVICE_NAME = "StatusService";
const MAX_LATEST_CHECKS = 25;

export interface IStatusService {
  updateMonitorStatus: (
    monitor: MonitorEntity,
    status: StatusResponse
  ) => Promise<StatusChangeResult>;

  calculateAvgResponseTime: (
    stats: IMonitorStats,
    statusResponse: StatusResponse
  ) => number;

  updateMonitorStats: (
    monitor: IMonitor,
    status: StatusResponse,
    statusChanged: boolean
  ) => Promise<IMonitorStats | null>;
  evaluateThresholds: (
    monitor: IMonitor,
    check: ICheck
  ) => Promise<ThresholdEvaluationResult>;
}

export type StatusChangeResult = [
  updatedMonitor: MonitorEntity,
  statusChanged: boolean
];

class StatusService implements IStatusService {
  public SERVICE_NAME: string;
  private monitorRepository: IMonitorRepository;
  constructor(monitorRepository: IMonitorRepository) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.monitorRepository = monitorRepository;
  }

  updateMonitorStatus = async (
    monitor: MonitorEntity,
    statusResponse: StatusResponse
  ): Promise<StatusChangeResult> => {
    const newStatus = statusResponse.status;
    monitor.lastCheckedAt = new Date();

    monitor.latestStatuses = monitor.latestStatuses || [];
    const prevLen = monitor.latestStatuses.length;
    monitor.latestStatuses.push(newStatus);
    while (monitor.latestStatuses.length > MAX_LATEST_CHECKS) {
      monitor.latestStatuses.shift();
    }

    if (monitor.status === "initializing") {
      monitor.status = newStatus;
      const lenAfter = monitor.latestStatuses.length;
      const thresholdReachedNow = lenAfter >= monitor.n && prevLen < monitor.n;
      const updated = await this.monitorRepository.updateById(
        monitor.id,
        monitor.teamId,
        monitor.updatedBy,
        monitor
      );
      if (!updated) {
        throw new ApiError("Failed to update monitor status", 500);
      }
      return [updated, thresholdReachedNow];
    }

    const { n } = monitor;
    const latestN = monitor.latestStatuses.slice(-n);
    if (latestN.length < n) {
      const updated = await this.monitorRepository.updateById(
        monitor.id,
        monitor.teamId,
        monitor.updatedBy,
        monitor
      );
      if (!updated) {
        throw new ApiError("Failed to update monitor status", 500);
      }
      return [updated, false];
    }

    const allDifferent = latestN.every((s) => s !== monitor.status);
    if (allDifferent && monitor.status !== newStatus) {
      monitor.status = newStatus;
    }
    const updated = await this.monitorRepository.updateById(
      monitor.id,
      monitor.teamId,
      monitor.updatedBy,
      monitor
    );
    if (!updated) {
      throw new ApiError("Failed to update monitor status", 500);
    }
    return [updated, allDifferent];
  };

  calculateAvgResponseTime = (
    stats: IMonitorStats,
    statusResponse: StatusResponse
  ): number => {
    let avgResponseTime = stats.avgResponseTime;
    // Set initial
    if (avgResponseTime === 0) {
      avgResponseTime = statusResponse.responseTime;
    } else {
      avgResponseTime =
        (avgResponseTime * (stats.totalChecks - 1) +
          statusResponse.responseTime) /
        stats.totalChecks;
    }
    return avgResponseTime;
  };

  updateMonitorStats = async (
    monitor: IMonitor,
    statusResponse: StatusResponse,
    statusChanged: boolean
  ) => {
    let stats = await MonitorStats.findOne({ monitorId: monitor._id });
    if (!stats) {
      stats = await MonitorStats.create({
        monitorId: monitor._id,
        currentStreakStartedAt: Date.now(),
      });
    }

    // Update check counts
    stats.totalChecks += 1;
    stats.totalUpChecks += statusResponse.status === "up" ? 1 : 0;
    stats.totalDownChecks += statusResponse.status === "down" ? 1 : 0;

    // Update streak
    if (!statusChanged) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
      stats.currentStreakStatus = statusResponse.status;
      stats.currentStreakStartedAt = Date.now();
    }

    // Update time stamps
    stats.lastCheckTimestamp = Date.now();
    stats.timeOfLastFailure =
      statusResponse.status === "down" ? Date.now() : stats.timeOfLastFailure;

    // Update stats that need updated check counts
    stats.avgResponseTime = this.calculateAvgResponseTime(
      stats,
      statusResponse
    );
    stats.uptimePercentage = stats.totalUpChecks / stats.totalChecks;

    // Other
    stats.lastResponseTime = statusResponse.responseTime;
    stats.maxResponseTime = Math.max(
      stats.maxResponseTime,
      statusResponse.responseTime
    );
    if (statusResponse.certificateExpiry !== null) {
      stats.certificateExpiry = statusResponse.certificateExpiry;
    }

    return await stats.save();
  };

  evaluateThresholds = async (
    monitor: IMonitor,
    check: ICheck
  ): Promise<ThresholdEvaluationResult> => {
    try {
      if (monitor.type !== "infrastructure" || monitor.status !== "up")
        return { hasBreach: false, notes: [], metrics: emptyMetrics() };
      if (!monitor.thresholds)
        return { hasBreach: false, notes: [], metrics: emptyMetrics() };
      if (!check.system)
        return { hasBreach: false, notes: [], metrics: emptyMetrics() };

      const t = monitor.thresholds;
      const breaches: string[] = [];
      const metrics: ThresholdEvaluationResult["metrics"] = emptyMetrics();

      // usage values in check.system are 0..1 decimals; thresholds are 0..100
      const cpuRaw = check.system.cpu?.usage_percent;
      const cpuPct = typeof cpuRaw === "number" ? cpuRaw * 100 : undefined;
      const cpuThreshold = typeof t.cpu === "number" ? t.cpu : undefined;
      metrics.cpu = {
        value: cpuPct,
        threshold: cpuThreshold,
        breached:
          cpuPct !== undefined &&
          cpuThreshold !== undefined &&
          cpuPct > cpuThreshold,
      };
      if (
        metrics.cpu.breached &&
        metrics.cpu.value !== undefined &&
        metrics.cpu.threshold !== undefined
      ) {
        breaches.push(`cpu ${metrics.cpu.value}% > ${metrics.cpu.threshold}%`);
      }

      const memRaw = check.system.memory?.usage_percent;
      const memPct = typeof memRaw === "number" ? memRaw * 100 : undefined;
      const memThreshold = typeof t.memory === "number" ? t.memory : undefined;
      metrics.memory = {
        value: memPct,
        threshold: memThreshold,
        breached:
          memPct !== undefined &&
          memThreshold !== undefined &&
          memPct > memThreshold,
      };
      if (
        metrics.memory.breached &&
        metrics.memory.value !== undefined &&
        metrics.memory.threshold !== undefined
      ) {
        breaches.push(
          `memory ${metrics.memory.value}% > ${metrics.memory.threshold}%`
        );
      }

      const diskUsagesRaw: number[] = Array.isArray(check.system.disk)
        ? check.system.disk
            .map((d) => d?.usage_percent)
            .filter((n): n is number => typeof n === "number")
        : [];
      const diskUsagesPct = diskUsagesRaw.map((n) => n * 100);
      const maxDiskPct = diskUsagesPct.length
        ? Math.max(...diskUsagesPct)
        : undefined;
      const diskThreshold = typeof t.disk === "number" ? t.disk : undefined;
      metrics.disk = {
        value: maxDiskPct,
        threshold: diskThreshold,
        breached:
          maxDiskPct !== undefined &&
          diskThreshold !== undefined &&
          maxDiskPct > diskThreshold,
      };
      if (
        metrics.disk.breached &&
        metrics.disk.value !== undefined &&
        metrics.disk.threshold !== undefined
      ) {
        breaches.push(
          `disk ${metrics.disk.value.toFixed(2)}% > ${metrics.disk.threshold}%`
        );
      }

      const temps: number[] = Array.isArray(check.system.cpu?.temperature)
        ? check.system.cpu.temperature.filter(
            (n): n is number => typeof n === "number"
          )
        : [];

      const maxTemp = temps.length ? Math.max(...temps) : undefined;
      if (
        typeof t.temperature === "number" &&
        typeof maxTemp === "number" &&
        maxTemp > t.temperature
      ) {
        breaches.push(`temperature ${maxTemp}C > ${t.temperature}C`);
      }

      const hasBreach = breaches.length > 0;

      return { hasBreach, notes: breaches, metrics };
    } catch {
      return { hasBreach: false, notes: [], metrics: emptyMetrics() };
    }
  };
}

export default StatusService;
