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

  // Create
  create = async (
    orgId: string,
    userId: string,
    currentTeamId: string,
    monitorData: MonitorEntity
  ) => {
    const monitorLiteral: Partial<IMonitor> = {
      ...monitorData,
      orgId: new mongoose.Types.ObjectId(orgId),
      teamId: new mongoose.Types.ObjectId(currentTeamId),
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
      notificationChannels: monitorData.notificationChannels?.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    };
    const monitor = await Monitor.create(monitorLiteral);
    return this.toEntity(monitor);
  };

  createMany = async (
    userId: string,
    orgId: string,
    teamId: string,
    monitorData: MonitorEntity[]
  ) => {
    const inserted = await Monitor.insertMany(
      monitorData.map((monitor) => ({
        name: monitor.name,
        type: monitor.type,
        interval: monitor.interval,
        url: monitor.url,
        n: monitor.n,
        orgId: new mongoose.Types.ObjectId(orgId),
        teamId: new mongoose.Types.ObjectId(teamId),
        createdBy: new mongoose.Types.ObjectId(userId),
        updatedBy: new mongoose.Types.ObjectId(userId),
      }))
    );
    return inserted.map(this.toEntity);
  };

  // Single fetch
  findById = async (monitorId: string, teamId: string) => {
    const monitor = await Monitor.findOne({ _id: monitorId, teamId });
    if (!monitor) return null;
    return this.toEntity(monitor);
  };

  // Collection fetches
  findAll = async () => {
    const monitors = await Monitor.find();
    return monitors.map(this.toEntity);
  };

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
    const monitors = await Monitor.find({ orgId });
    return monitors.map(this.toEntity);
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
  deleteAll = async () => {
    const deleted = await Monitor.deleteMany({});
    return deleted.acknowledged;
  };
  deleteById = async (monitorId: string, teamId: string) => {
    await Monitor.deleteOne({ _id: monitorId, teamId });
    return true;
  };
  deleteByOrgId = async (orgId: string) => {
    const deleted = await Monitor.deleteMany({ orgId });
    return deleted.acknowledged;
  };

  togglePauseById = async (
    monitorId: string,
    teamId: string,
    userId: string
  ) => {
    const monitor = await Monitor.findOneAndUpdate(
      { _id: monitorId, teamId },
      [
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ["$status", "paused"] },
                then: "resuming",
                else: "paused",
              },
            },
            updatedBy: userId,
            updatedAt: new Date(),
          },
        },
      ],
      { new: true }
    );
    if (!monitor) return null;
    return this.toEntity(monitor);
  };

  // Update
  updateById = async (
    monitorId: string,
    teamId: string,
    userId: string,
    patch: Partial<MonitorEntity>
  ) => {
    const updatedMonitor = await Monitor.findOneAndUpdate(
      { _id: monitorId, teamId },
      {
        $set: {
          ...patch,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      },
      { new: true, runValidators: true }
    );
    if (!updatedMonitor) return null;
    return this.toEntity(updatedMonitor);
  };

  // Counts
  countByOrgId(orgId: string): Promise<number> {
    return Monitor.countDocuments({ orgId });
  }

  countByIdAndTeamId = async (monitorIds: string[], teamId: string) => {
    return await Monitor.countDocuments({
      _id: { $in: monitorIds },
      teamId: teamId,
    });
  };
}

export default MongoMonitorRepository;
