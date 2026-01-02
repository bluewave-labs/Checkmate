import { Monitor, IMonitor } from "@/db/models/index.js";
import { IMonitorRepository, TeamQueryConfig } from "@/repositories/index.js";
import type { Monitor as MonitorEntity } from "@/types/domain/monitor.js";
import mongoose from "mongoose";
class MongoMonitorRepository implements IMonitorRepository {
  private toEntity = (monitor: IMonitor): MonitorEntity => {
    return {
      id: monitor._id.toString(),
      orgId: monitor.orgId.toString(),
      teamId: monitor.teamId.toString(),
      name: monitor.name,
      url: monitor.url,
      port: monitor.port,
      secret: monitor.secret,
      type: monitor.type,
      interval: monitor.interval,
      rejectUnauthorized: monitor.rejectUnauthorized,
      status: monitor.status,
      n: monitor.n,
      thresholds: monitor.thresholds,
      lastCheckedAt: monitor.lastCheckedAt,
      latestStatuses: monitor.latestStatuses,
      notificationChannels: monitor.notificationChannels?.map((id) =>
        id.toString()
      ),
      createdBy: monitor.createdBy.toString(),
      updatedBy: monitor.updatedBy.toString(),
      createdAt: monitor.createdAt,
      updatedAt: monitor.updatedAt,
    };
  };

  // Single fetch
  findById = async (monitorId: string, teamId: string) => {
    const monitor = await Monitor.findOne({ _id: monitorId, teamId });
    if (!monitor) return null;
    return this.toEntity(monitor);
  };

  // Collection fetches
  findByTeamId = async (teamId: string) => {
    const monitors = await Monitor.find({ teamId });
    return monitors.map(this.toEntity);
  };

  findByTeamIdWithConfig = async (teamId: string, config: TeamQueryConfig) => {
    if (!config) {
      const monitors = await Monitor.find({ teamId });
      return monitors.map(this.toEntity);
    }

    const { search, sortField, sortOrder, page, rowsPerPage, type, status } =
      config;

    const match: Record<string, unknown> = {
      teamId: new mongoose.Types.ObjectId(teamId),
    };

    if (search && search.trim() !== "") {
      const term = search.trim();
      (match as any).$or = [
        { name: { $regex: term, $options: "i" } },
        { url: { $regex: term, $options: "i" } },
      ];
    }

    if (Array.isArray(type) && type.length > 0) {
      match.type = { $in: type };
    }

    if (Array.isArray(status) && status.length > 0) {
      match.status = { $in: status };
    }

    const skip = page * rowsPerPage;

    const monitors = await Monitor.find(match)
      .sort({ [sortField]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(rowsPerPage);

    return monitors.map(this.toEntity);
  };
  findByOrgId = async (orgId: string) => {
    return [];
  };

  findMonitorCountsByTeamId = async (teamId: string) => {
    const countResult = await Monitor.aggregate([
      {
        $match: { teamId: new mongoose.Types.ObjectId(teamId) },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upCount: { $sum: { $cond: [{ $eq: ["$status", "up"] }, 1, 0] } },
          downCount: { $sum: { $cond: [{ $eq: ["$status", "down"] }, 1, 0] } },
          pausedCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["paused", "resuming"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    const counts = countResult[0] || {
      total: 0,
      upCount: 0,
      downCount: 0,
      pausedCount: 0,
    };
    return counts;
  };

  // Deletions
  deleteById = async (id: string) => {
    return false;
  };
  deleteByOrgId = async (orgId: string) => {
    return 0;
  };
}

export default MongoMonitorRepository;
