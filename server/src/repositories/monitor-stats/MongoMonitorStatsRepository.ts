import type { IMonitorStats } from "@/db/models/index.js";
import { MonitorStats } from "@/db/models/index.js";
import type { IMonitorStatsRepository } from "@/repositories/monitor-stats/IMonitorStatsRepository.js";
import type { MonitorStats as MonitorStatsEntity } from "@/types/domain/monitorStats.js";
import ApiError from "@/utils/ApiError.js";

class MongoMonitorStatsRepository implements IMonitorStatsRepository {
  private toEntity(doc: IMonitorStats): MonitorStatsEntity {
    return {
      id: doc._id.toString(),
      monitorId: doc.monitorId.toString(),
      avgResponseTime: doc.avgResponseTime,
      maxResponseTime: doc.maxResponseTime,
      lastResponseTime: doc.lastResponseTime,
      totalChecks: doc.totalChecks,
      totalUpChecks: doc.totalUpChecks,
      totalDownChecks: doc.totalDownChecks,
      uptimePercentage: doc.uptimePercentage,
      lastCheckTimestamp: doc.lastCheckTimestamp,
      timeOfLastFailure: doc.timeOfLastFailure,
      currentStreak: doc.currentStreak,
      currentStreakStatus: doc.currentStreakStatus,
      currentStreakStartedAt: doc.currentStreakStartedAt,
      certificateExpiry: doc.certificateExpiry ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  create = async (monitorStatsData: Partial<MonitorStatsEntity>) => {
    const monitorStats = await MonitorStats.create(monitorStatsData);
    return this.toEntity(monitorStats);
  };

  findByMonitorId = async (monitorId: string) => {
    const monitorStats = await MonitorStats.findOne({ monitorId });
    if (!monitorStats) {
      throw new ApiError("Monitor stats not found", 404);
    }
    return this.toEntity(monitorStats);
  };

  updateByMonitorId = async (
    monitorId: string,
    updateData: Partial<MonitorStatsEntity>
  ) => {
    const monitorStats = await MonitorStats.findOneAndUpdate(
      { monitorId },
      updateData,
      { new: true }
    );
    if (!monitorStats) {
      throw new ApiError("Monitor stats not found", 404);
    }
    return this.toEntity(monitorStats);
  };

  deleteManyExcludedByMonitorIds = async (monitorIds: string[]) => {
    const result = await MonitorStats.deleteMany({
      monitorId: { $nin: monitorIds },
    });
    return result.deletedCount ?? 0;
  };
}

export default MongoMonitorStatsRepository;
