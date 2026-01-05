import type { IChecksRepository } from "@/repositories/index.js";
import { CheckEntity, AggregateCheck, Monitor } from "@/types/domain/index.js";
import type { ICheck } from "@/db/models/index.js";
import { Check } from "@/db/models/index.js";
import mongoose from "mongoose";
import { StatsHourly, StatsDaily } from "@/db/models/index.js";

export type LatestChecksByMonitor = Array<{
  id: string;
  latestChecks: CheckEntity[];
}>;

class MongoCheckRepository implements IChecksRepository {
  private toEntity = (check: ICheck): CheckEntity => {
    const entity: CheckEntity = {
      id: check._id.toString(),
      monitorId: check.metadata.monitorId.toString(),
      teamId: check.metadata.teamId.toString(),
      type: check.metadata.type,
      status: check.status,
      httpStatusCode: check.httpStatusCode,
      message: check.message,
      responseTime: check.responseTime,
      timings: check.timings,
      errorMessage: check.errorMessage,
      ackAt: check.ackAt,
      ackBy: check.ackBy?.toString(),
      system: check.system,
      capture: check.capture,
      lighthouse: check.lighthouse,
      dockerContainers: check.dockerContainers,
      createdAt: check.createdAt,
      updatedAt: check.updatedAt,
      expiry: check.expiry,
    };

    return entity;
  };

  private toAggregateCheck = (doc: any): AggregateCheck => {
    const agg: AggregateCheck = {
      bucketDate: doc._id instanceof Date ? doc._id : new Date(doc._id),
      count: doc.count,
      upChecks: doc.upChecks,
      downChecks: doc.downChecks,
      avgResponseTime: doc.avgResponseTime,
      avgResponseTimeUp: doc.avgResponseTimeUp,
      avgResponseTimeDown: doc.avgResponseTimeDown,
      totalContainers: doc.totalContainers,
      runningContainers: doc.runningContainers,
      healthyContainers: doc.healthyContainers,
      accessibility: doc.accessibility,
      bestPractices: doc.bestPractices,
      seo: doc.seo,
      performance: doc.performance,
      cls: doc.cls,
      si: doc.si,
      fcp: doc.fcp,
      lcp: doc.lcp,
      tbt: doc.tbt,
    };

    if (doc.cpu || doc.memory || doc.disk || doc.host || doc.net) {
      if (doc.cpu) agg.cpu = doc.cpu;
      if (doc.memory) agg.memory = doc.memory;
      if (Array.isArray(doc.disk)) agg.disk = doc.disk;
      if (doc.host) agg.host = doc.host;
      if (Array.isArray(doc.net)) agg.net = doc.net;
    }
    return agg;
  };

  private getBaseGroup = (): Record<string, any> => {
    return {
      _id: { $dateTrunc: { date: "$createdAt", unit: "minute" } },
      count: { $sum: 1 },
      avgResponseTime: { $avg: "$responseTime" },
    };
  };

  private getBaseProjection = (): object => {
    return { status: 1, responseTime: 1, createdAt: 1 };
  };

  private getPageSpeedGroup = (): Record<string, any> => {
    return {
      _id: { $dateTrunc: { date: "$createdAt", unit: "minute" } },
      count: { $sum: 1 },
      avgResponseTime: { $avg: "$responseTime" },
      accessibility: { $avg: "$lighthouse.accessibility" },
      bestPractices: { $avg: "$lighthouse.bestPractices" },
      seo: { $avg: "$lighthouse.seo" },
      performance: { $avg: "$lighthouse.performance" },
      cls: { $avg: "$lighthouse.audits.cls.score" },
      si: { $avg: "$lighthouse.audits.si.score" },
      fcp: { $avg: "$lighthouse.audits.fcp.score" },
      lcp: { $avg: "$lighthouse.audits.lcp.score" },
      tbt: { $avg: "$lighthouse.audits.tbt.score" },
    };
  };

  private getPageSpeedProjection = (): object => {
    const projectStage: any = { status: 1, responseTime: 1, createdAt: 1 };
    projectStage["lighthouse.accessibility"] = 1;
    projectStage["lighthouse.seo"] = 1;
    projectStage["lighthouse.bestPractices"] = 1;
    projectStage["lighthouse.performance"] = 1;
    projectStage["lighthouse.audits.cls.score"] = 1;
    projectStage["lighthouse.audits.si.score"] = 1;
    projectStage["lighthouse.audits.fcp.score"] = 1;
    projectStage["lighthouse.audits.lcp.score"] = 1;
    projectStage["lighthouse.audits.tbt.score"] = 1;
    return projectStage;
  };

  private getInfraGroup = (): Record<string, any> => {
    return {
      _id: { $dateTrunc: { date: "$createdAt", unit: "minute" } },
      count: { $sum: 1 },
      avgResponseTime: { $avg: "$responseTime" },
      physicalCores: { $last: "$system.cpu.physical_core" },
      logicalCores: { $last: "$system.cpu.logical_core" },
      frequency: { $avg: "$system.cpu.frequency" },
      currentFrequency: { $last: "$system.cpu.current_frequency" },
      tempsArrays: { $push: "$system.cpu.temperature" },
      freePercent: { $avg: "$system.cpu.free_percent" },
      usedPercent: { $avg: "$system.cpu.usage_percent" },
      total_bytes: { $last: "$system.memory.total_bytes" },
      available_bytes: { $last: "$system.memory.available_bytes" },
      used_bytes: { $last: "$system.memory.used_bytes" },
      memory_usage_percent: { $avg: "$system.memory.usage_percent" },
      disksArray: { $push: "$system.disk" },
      os: { $last: "$system.host.os" },
      platform: { $last: "$system.host.platform" },
      kernel_version: { $last: "$system.host.kernel_version" },
      pretty_name: { $last: "$system.host.pretty_name" },
      netsArray: { $push: "$system.net" },
    };
  };

  private getInfraProjection = (): object => {
    const projectStage: any = { status: 1, responseTime: 1, createdAt: 1 };
    projectStage["system.cpu.physical_core"] = 1;
    projectStage["system.cpu.logical_core"] = 1;
    projectStage["system.cpu.frequency"] = 1;
    projectStage["system.cpu.current_frequency"] = 1;
    projectStage["system.cpu.temperature"] = 1;
    projectStage["system.cpu.free_percent"] = 1;
    projectStage["system.cpu.usage_percent"] = 1;
    projectStage["system.memory.total_bytes"] = 1;
    projectStage["system.memory.available_bytes"] = 1;
    projectStage["system.memory.used_bytes"] = 1;
    projectStage["system.memory.usage_percent"] = 1;
    projectStage["system.disk"] = 1;
    projectStage["system.host.os"] = 1;
    projectStage["system.host.platform"] = 1;
    projectStage["system.host.kernel_version"] = 1;
    projectStage["system.host.pretty_name"] = 1;
    projectStage["system.net"] = 1;
    return projectStage;
  };

  private getDockerGroup = (): Record<string, any> => {
    return {
      _id: { $dateTrunc: { date: "$createdAt", unit: "minute" } },
      count: { $sum: 1 },
      avgResponseTime: { $last: "$responseTime" },
      totalContainers: {
        $last: { $size: { $ifNull: ["$dockerContainers", []] } },
      },
      runningContainers: {
        $last: {
          $size: {
            $filter: {
              input: { $ifNull: ["$dockerContainers", []] },
              as: "c",
              cond: { $eq: ["$$c.running", true] },
            },
          },
        },
      },
      healthyContainers: {
        $last: {
          $size: {
            $filter: {
              input: { $ifNull: ["$dockerContainers", []] },
              as: "c",
              cond: { $eq: ["$$c.health.healthy", true] },
            },
          },
        },
      },
    };
  };

  private getDockerProjection = (): object => {
    const projectStage: any = { status: 1, responseTime: 1, createdAt: 1 };
    projectStage["dockerContainers"] = 1;
    return projectStage;
  };

  private getFinalProjection = (type: string): object => {
    if (type === "pagespeed") {
      return {
        _id: 1,
        count: 1,
        avgResponseTime: 1,
        accessibility: "$accessibility",
        seo: "$seo",
        bestPractices: "$bestPractices",
        performance: "$performance",
        cls: "$cls",
        si: "$si",
        fcp: "$fcp",
        lcp: "$lcp",
        tbt: "$tbt",
      };
    }

    if (type === "infrastructure") {
      return {
        _id: 1,
        count: 1,
        avgResponseTime: 1,
        cpu: {
          physical_core: "$physicalCores",
          logical_core: "$logicalCores",
          frequency: "$frequency",
          current_frequency: "$currentFrequency",
          temperature: {
            $map: {
              input: {
                $range: [
                  0,
                  {
                    $size: {
                      $ifNull: [{ $arrayElemAt: ["$tempsArrays", 0] }, []],
                    },
                  },
                ],
              },
              as: "idx",
              in: {
                $avg: {
                  $map: {
                    input: { $ifNull: ["$tempsArrays", []] },
                    as: "arr",
                    in: { $arrayElemAt: ["$$arr", "$$idx"] },
                  },
                },
              },
            },
          },
          free_percent: "$freePercent",
          used_percent: "$usedPercent",
        },
        memory: {
          total_bytes: "$total_bytes",
          available_bytes: "$available_bytes",
          used_bytes: "$used_bytes",
          usage_percent: "$memory_usage_percent",
        },
        disk: {
          $map: {
            input: {
              $range: [
                0,
                {
                  $size: {
                    $ifNull: [{ $arrayElemAt: ["$disksArray", 0] }, []],
                  },
                },
              ],
            },
            as: "idx",
            in: {
              $let: {
                vars: {
                  diskGroup: {
                    $map: {
                      input: { $ifNull: ["$disksArray", []] },
                      as: "diskArr",
                      in: { $arrayElemAt: ["$$diskArr", "$$idx"] },
                    },
                  },
                },
                in: {
                  device: { $arrayElemAt: ["$$diskGroup.device", 0] },
                  total_bytes: { $avg: "$$diskGroup.total_bytes" },
                  free_bytes: { $avg: "$$diskGroup.free_bytes" },
                  used_bytes: { $avg: "$$diskGroup.used_bytes" },
                  usage_percent: { $avg: "$$diskGroup.usage_percent" },
                  total_inodes: { $avg: "$$diskGroup.total_inodes" },
                  free_inodes: { $avg: "$$diskGroup.free_inodes" },
                  used_inodes: { $avg: "$$diskGroup.used_inodes" },
                  inodes_usage_percent: {
                    $avg: "$$diskGroup.inodes_usage_percent",
                  },
                  read_bytes: { $avg: "$$diskGroup.read_bytes" },
                  write_bytes: { $avg: "$$diskGroup.write_bytes" },
                  read_time: { $avg: "$$diskGroup.read_time" },
                  write_time: { $avg: "$$diskGroup.write_time" },
                },
              },
            },
          },
        },
        host: {
          os: "$os",
          platform: "$platform",
          kernel_version: "$kernel_version",
          pretty_name: "$pretty_name",
        },
        net: {
          $map: {
            input: {
              $range: [
                0,
                {
                  $size: { $ifNull: [{ $arrayElemAt: ["$netsArray", 0] }, []] },
                },
              ],
            },
            as: "idx",
            in: {
              $let: {
                vars: {
                  netGroup: {
                    $map: {
                      input: { $ifNull: ["$netsArray", []] },
                      as: "netArr",
                      in: { $arrayElemAt: ["$$netArr", "$$idx"] },
                    },
                  },
                },
                in: {
                  name: { $arrayElemAt: ["$$netGroup.name", 0] },
                  bytes_sent: { $avg: "$$netGroup.bytes_sent" },
                  bytes_recv: { $avg: "$$netGroup.bytes_recv" },
                  packets_sent: { $avg: "$$netGroup.packets_sent" },
                  packets_recv: { $avg: "$$netGroup.packets_recv" },
                  err_in: { $avg: "$$netGroup.err_in" },
                  err_out: { $avg: "$$netGroup.err_out" },
                  drop_in: { $avg: "$$netGroup.drop_in" },
                  drop_out: { $avg: "$$netGroup.drop_out" },
                  fifo_in: { $avg: "$$netGroup.fifo_in" },
                  fifo_out: { $avg: "$$netGroup.fifo_out" },
                },
              },
            },
          },
        },
      };
    }
    if (type === "docker") {
      return {
        _id: 1,
        count: 1,
        avgResponseTime: 1,
        totalContainers: "$totalContainers",
        runningContainers: "$runningContainers",
        healthyContainers: "$healthyContainers",
        runningContainersSnapshot: "$runningContainersSnapshot",
        totalExposedPorts: "$totalExposedPorts",
        uniqueImages: "$uniqueImages",
        runningPercent: {
          $cond: [
            { $gt: ["$totalContainers", 0] },
            {
              $multiply: [
                { $divide: ["$runningContainers", "$totalContainers"] },
                100,
              ],
            },
            null,
          ],
        },
        healthyPercent: {
          $cond: [
            { $gt: ["$totalContainers", 0] },
            {
              $multiply: [
                { $divide: ["$healthyContainers", "$totalContainers"] },
                100,
              ],
            },
            null,
          ],
        },
      };
    }
    return {};
  };

  findLatestChecksByMonitorIds = async (monitorIds: string[]) => {
    const mongoIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
    const checkMap = await Check.aggregate([
      {
        $match: {
          "metadata.monitorId": { $in: mongoIds },
        },
      },
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
    return checkMap.map((cm) => {
      return {
        id: cm._id,
        latestChecks: cm.latestChecks.map((c: ICheck) => this.toEntity(c)),
      };
    });
  };

  findRecentChecksByMonitor = async (monitor: Monitor, startDate: Date) => {
    const endDate = new Date();
    const matchStage: {
      "metadata.monitorId": mongoose.Types.ObjectId;
      createdAt: { $gte: Date; $lt: Date };
    } = {
      "metadata.monitorId": new mongoose.Types.ObjectId(monitor.id),
      createdAt: { $gte: startDate, $lt: endDate },
    };

    let groupClause;
    if (monitor.type === "pagespeed") {
      groupClause = this.getPageSpeedGroup();
    } else if (monitor.type === "infrastructure") {
      groupClause = this.getInfraGroup();
    } else if (monitor.type === "docker") {
      groupClause = this.getDockerGroup();
    } else {
      groupClause = this.getBaseGroup();
    }

    let projectStage;
    if (monitor.type === "pagespeed") {
      projectStage = this.getPageSpeedProjection();
    } else if (monitor.type === "infrastructure") {
      projectStage = this.getInfraProjection();
    } else if (monitor.type === "docker") {
      projectStage = this.getDockerProjection();
    } else {
      projectStage = this.getBaseProjection();
    }

    let finalProjection = {};
    if (
      monitor.type === "pagespeed" ||
      monitor.type === "infrastructure" ||
      monitor.type === "docker"
    ) {
      finalProjection = this.getFinalProjection(monitor.type);
    } else {
      finalProjection = { _id: 1, count: 1, avgResponseTime: 1 };
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $project: { ...projectStage, status: 1 } },
    ];

    // For infrastructure and docker monitors we rely on $last in group, which requires ordering by createdAt
    if (monitor.type === "infrastructure" || monitor.type === "docker") {
      pipeline.push({ $sort: { createdAt: 1 } });
    }

    pipeline.push(
      {
        $group: {
          ...groupClause,
          upChecks: { $sum: { $cond: [{ $eq: ["$status", "up"] }, 1, 0] } },
          downChecks: { $sum: { $cond: [{ $eq: ["$status", "down"] }, 1, 0] } },
          sumResponseUp: {
            $sum: { $cond: [{ $eq: ["$status", "up"] }, "$responseTime", 0] },
          },
          sumResponseDown: {
            $sum: { $cond: [{ $eq: ["$status", "down"] }, "$responseTime", 0] },
          },
        },
      },
      { $sort: { _id: -1 } },
      {
        $project: {
          ...finalProjection,
          upChecks: 1,
          downChecks: 1,
          avgResponseTimeUp: {
            $cond: [
              { $gt: ["$upChecks", 0] },
              { $divide: ["$sumResponseUp", "$upChecks"] },
              null,
            ],
          },
          avgResponseTimeDown: {
            $cond: [
              { $gt: ["$downChecks", 0] },
              { $divide: ["$sumResponseDown", "$downChecks"] },
              null,
            ],
          },
        },
      }
    );

    const checks = await Check.aggregate(pipeline)
      .allowDiskUse(true)
      .hint({ "metadata.monitorId": 1, createdAt: 1 });

    return checks.map(this.toAggregateCheck);
  };

  findDateRangeChecksByMonitor = async (
    monitor: Monitor,
    startDate: Date,
    range: string
  ) => {
    const useDaily = range === "30d";
    const Model = useDaily ? StatsDaily : StatsHourly;
    const endDate = new Date();

    const docs = await Model.find({
      monitorId: monitor.id,
      windowStart: { $gte: startDate, $lt: endDate },
    })
      .sort({ windowStart: -1 })
      .lean();

    const checks = (docs as any[]).map((d) => {
      const base: any = {
        _id: new Date(d.windowStart).toISOString(),
        count: d.count ?? 0,
        avgResponseTime: d.avgResponseTime ?? 0,
        upChecks: d.upChecks ?? 0,
        downChecks: d.downChecks ?? 0,
        avgResponseTimeUp: d.avgResponseTimeUp ?? null,
        avgResponseTimeDown: d.avgResponseTimeDown ?? null,
      };
      if (monitor.type === "pagespeed") {
        return {
          ...base,
          accessibility: d.accessibility,
          seo: d.seo,
          bestPractices: d.bestPractices,
          performance: d.performance,
          cls: d.cls,
          si: d.si,
          fcp: d.fcp,
          lcp: d.lcp,
          tbt: d.tbt,
        };
      }
      if (monitor.type === "infrastructure") {
        return {
          ...base,
          cpu: d.cpu,
          memory: d.memory,
          disk: d.disk,
          host: d.host,
          net: d.net,
        };
      }
      if (monitor.type === "docker") {
        return {
          ...base,
          totalContainers: d.dockerTotalContainers,
          runningContainers: d.dockerRunningContainers,
          healthyContainers: d.dockerHealthyContainers,
          totalExposedPorts: d.dockerTotalExposedPorts,
          uniqueImages: d.dockerUniqueImages,
          runningPercent: d.dockerRunningPercent,
          healthyPercent: d.dockerHealthyPercent,
        };
      }
      return base;
    });

    return checks.map(this.toAggregateCheck);
  };
}

export default MongoCheckRepository;
