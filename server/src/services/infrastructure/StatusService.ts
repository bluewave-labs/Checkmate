import { IMonitor, IMonitorStats, MonitorStats } from "@/db/models/index.js";
import { StatusResponse } from "./NetworkService.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "StatusService";
const MAX_LATEST_CHECKS = 25;
export interface IStatusService {
  updateMonitorStatus: (
    monitor: IMonitor,
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
}

export type StatusChangeResult = [
  updatedMonitor: IMonitor,
  statusChanged: boolean
];

class StatusService implements IStatusService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  updateMonitorStatus = async (
    monitor: IMonitor,
    statusResponse: StatusResponse
  ): Promise<StatusChangeResult> => {
    const newStatus = statusResponse.status;
    monitor.lastCheckedAt = new Date();

    // Store latest checks for display
    monitor.latestChecks = monitor.latestChecks || [];
    monitor.latestChecks.push({
      status: newStatus,
      responseTime: statusResponse.responseTime,
      checkedAt: monitor.lastCheckedAt,
    });
    while (monitor.latestChecks.length > MAX_LATEST_CHECKS) {
      monitor.latestChecks.shift();
    }

    // Update monitor status
    if (monitor.status === "initializing") {
      monitor.status = newStatus;
      return [await monitor.save(), monitor.latestChecks.length === 0];
    } else {
      const { n } = monitor;
      const latestChecks = monitor.latestChecks.slice(-n);
      // Return early if not enough statuses to evaluate
      if (latestChecks.length < n) {
        return [await monitor.save(), false];
      }

      // If all different than current status, update status
      const allDifferent = latestChecks.every(
        (check) => check.status !== monitor.status
      );
      if (allDifferent && monitor.status !== newStatus) {
        monitor.status = newStatus;
      }
      return [await monitor.save(), allDifferent];
    }
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
    const stats = await MonitorStats.findOne({ monitorId: monitor._id });
    if (!stats) {
      throw new ApiError("MonitorStats not found", 500);
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

    return await stats.save();
  };
}

export default StatusService;
