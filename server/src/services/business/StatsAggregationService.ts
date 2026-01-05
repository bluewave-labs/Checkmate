import mongoose from "mongoose";
import { Check } from "@/db/models/index.js";
import { StatsHourly } from "@/db/models/index.js";
import { StatsDaily } from "@/db/models/index.js";
import type { MonitorType } from "@/types/domain/index.js";

export interface IStatsAggregationService {
  upsertHourly: (windowStart: Date, windowEnd: Date) => Promise<number>;
  rollupDaily: (
    dayStart: Date,
    dayEnd: Date,
    finalize?: boolean
  ) => Promise<number>;
}

const BASE_TYPES: MonitorType[] = ["http", "https", "port", "ping"];

class StatsAggregationService implements IStatsAggregationService {
  private makeUpsertOp = (d: any, windowStart: Date, windowEnd: Date) => {
    return {
      updateOne: {
        filter: { monitorId: d._id, windowStart },
        update: {
          $setOnInsert: {
            monitorId: d._id,
            teamId: d.teamId,
            type: d.type,
            windowStart,
            windowEnd,
          },
          $set: {
            finalized: false,
            count: d.count ?? 0,
            avgResponseTime: d.avgResponseTime ?? 0,
            upChecks: d.upChecks ?? 0,
            downChecks: d.downChecks ?? 0,
            avgResponseTimeUp: (d.avgResponseTimeUp ?? null) as any,
            avgResponseTimeDown: (d.avgResponseTimeDown ?? null) as any,
            accessibility: d.accessibility,
            bestPractices: d.bestPractices,
            seo: d.seo,
            performance: d.performance,
            cls: d.cls,
            si: d.si,
            fcp: d.fcp,
            lcp: d.lcp,
            tbt: d.tbt,
            cpu: d.cpu,
            memory: d.memory,
            disk: d.disk,
            host: d.host,
            net: d.net,
            // Docker (present when type === "docker")
            dockerRunningPercent: d.dockerRunningPercent,
            dockerHealthyPercent: d.dockerHealthyPercent,
            dockerRunningContainers: d.dockerRunningContainers,
            dockerHealthyContainers: d.dockerHealthyContainers,
            dockerTotalContainers: d.dockerTotalContainers,
          },
        },
        upsert: true,
      },
    };
  };

  upsertHourly = async (
    windowStart: Date,
    windowEnd: Date
  ): Promise<number> => {
    const matchWindow = { createdAt: { $gte: windowStart, $lt: windowEnd } };

    // 1) Base types (http/https/port/ping)
    const baseAgg = await Check.aggregate<{
      _id: mongoose.Types.ObjectId;
      teamId: mongoose.Types.ObjectId;
      type: MonitorType;
      count: number;
      avgResponseTime: number;
    }>([
      { $match: { ...matchWindow, "metadata.type": { $in: BASE_TYPES } } },
      {
        $group: {
          _id: "$metadata.monitorId",
          teamId: { $first: "$metadata.teamId" },
          type: { $first: "$metadata.type" },
          count: { $sum: 1 },
          avgResponseTime: { $avg: "$responseTime" },
          upChecks: {
            $sum: { $cond: [{ $eq: ["$status", "up"] }, 1, 0] },
          },
          downChecks: {
            $sum: { $cond: [{ $eq: ["$status", "down"] }, 1, 0] },
          },
          sumResponseUp: {
            $sum: {
              $cond: [{ $eq: ["$status", "up"] }, "$responseTime", 0],
            },
          },
          sumResponseDown: {
            $sum: {
              $cond: [{ $eq: ["$status", "down"] }, "$responseTime", 0],
            },
          },
        },
      },
      {
        $project: {
          teamId: 1,
          type: 1,
          count: 1,
          avgResponseTime: 1,
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
      },
    ]);

    // 2) Pagespeed
    const pagespeedAgg = await Check.aggregate<any>([
      { $match: { ...matchWindow, "metadata.type": "pagespeed" } },
      {
        $project: {
          status: 1,
          responseTime: 1,
          createdAt: 1,
          "lighthouse.accessibility": 1,
          "lighthouse.bestPractices": 1,
          "lighthouse.seo": 1,
          "lighthouse.performance": 1,
          "lighthouse.audits.cls.score": 1,
          "lighthouse.audits.si.score": 1,
          "lighthouse.audits.fcp.score": 1,
          "lighthouse.audits.lcp.score": 1,
          "lighthouse.audits.tbt.score": 1,
          "metadata.monitorId": 1,
          "metadata.teamId": 1,
          "metadata.type": 1,
        },
      },
      {
        $group: {
          _id: "$metadata.monitorId",
          teamId: { $first: "$metadata.teamId" },
          type: { $first: "$metadata.type" },
          count: { $sum: 1 },
          avgResponseTime: { $avg: "$responseTime" },
          upChecks: { $sum: { $cond: [{ $eq: ["$status", "up"] }, 1, 0] } },
          downChecks: { $sum: { $cond: [{ $eq: ["$status", "down"] }, 1, 0] } },
          sumResponseUp: {
            $sum: { $cond: [{ $eq: ["$status", "up"] }, "$responseTime", 0] },
          },
          sumResponseDown: {
            $sum: { $cond: [{ $eq: ["$status", "down"] }, "$responseTime", 0] },
          },
          accessibility: { $avg: "$lighthouse.accessibility" },
          bestPractices: { $avg: "$lighthouse.bestPractices" },
          seo: { $avg: "$lighthouse.seo" },
          performance: { $avg: "$lighthouse.performance" },
          cls: { $avg: "$lighthouse.audits.cls.score" },
          si: { $avg: "$lighthouse.audits.si.score" },
          fcp: { $avg: "$lighthouse.audits.fcp.score" },
          lcp: { $avg: "$lighthouse.audits.lcp.score" },
          tbt: { $avg: "$lighthouse.audits.tbt.score" },
        },
      },
      {
        $project: {
          teamId: 1,
          type: 1,
          count: 1,
          avgResponseTime: 1,
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
          accessibility: 1,
          bestPractices: 1,
          seo: 1,
          performance: 1,
          cls: 1,
          si: 1,
          fcp: 1,
          lcp: 1,
          tbt: 1,
        },
      },
    ]);

    // 3) Infrastructure
    const infraAgg = await Check.aggregate<any>([
      { $match: { ...matchWindow, "metadata.type": "infrastructure" } },
      {
        $project: {
          status: 1,
          responseTime: 1,
          createdAt: 1,
          "system.cpu.physical_core": 1,
          "system.cpu.logical_core": 1,
          "system.cpu.frequency": 1,
          "system.cpu.current_frequency": 1,
          "system.cpu.temperature": 1,
          "system.cpu.free_percent": 1,
          "system.cpu.usage_percent": 1,
          "system.memory.total_bytes": 1,
          "system.memory.available_bytes": 1,
          "system.memory.used_bytes": 1,
          "system.memory.usage_percent": 1,
          "system.disk": 1,
          "system.host.os": 1,
          "system.host.platform": 1,
          "system.host.kernel_version": 1,
          "system.host.pretty_name": 1,
          "system.net": 1,
          "metadata.monitorId": 1,
          "metadata.teamId": 1,
          "metadata.type": 1,
        },
      },
      {
        $group: {
          _id: "$metadata.monitorId",
          teamId: { $first: "$metadata.teamId" },
          type: { $first: "$metadata.type" },
          count: { $sum: 1 },
          avgResponseTime: { $avg: "$responseTime" },
          upChecks: { $sum: { $cond: [{ $eq: ["$status", "up"] }, 1, 0] } },
          downChecks: { $sum: { $cond: [{ $eq: ["$status", "down"] }, 1, 0] } },
          sumResponseUp: {
            $sum: { $cond: [{ $eq: ["$status", "up"] }, "$responseTime", 0] },
          },
          sumResponseDown: {
            $sum: { $cond: [{ $eq: ["$status", "down"] }, "$responseTime", 0] },
          },
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
        },
      },
      {
        $project: {
          _id: 1,
          teamId: 1,
          type: 1,
          count: 1,
          avgResponseTime: 1,
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
                    $size: {
                      $ifNull: [{ $arrayElemAt: ["$netsArray", 0] }, []],
                    },
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
        },
      },
    ]);

    let upserts = 0;

    const bulkOps: any[] = [];

    baseAgg.forEach((el) =>
      bulkOps.push(this.makeUpsertOp(el, windowStart, windowEnd))
    );
    pagespeedAgg.forEach((el) =>
      bulkOps.push(this.makeUpsertOp(el, windowStart, windowEnd))
    );
    infraAgg.forEach((el) =>
      bulkOps.push(this.makeUpsertOp(el, windowStart, windowEnd))
    );

    // 4) Docker hourly
    const dockerAgg = await Check.aggregate<any>([
      { $match: { ...matchWindow, "metadata.type": "docker" } },
      {
        $project: {
          status: 1,
          responseTime: 1,
          createdAt: 1,
          dockerContainers: 1,
          "metadata.monitorId": 1,
          "metadata.teamId": 1,
          "metadata.type": 1,
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $addFields: {
          total: { $size: { $ifNull: ["$dockerContainers", []] } },
          running: {
            $size: {
              $filter: {
                input: { $ifNull: ["$dockerContainers", []] },
                as: "c",
                cond: { $eq: ["$$c.running", true] },
              },
            },
          },
          healthy: {
            $size: {
              $filter: {
                input: { $ifNull: ["$dockerContainers", []] },
                as: "c",
                cond: { $eq: ["$$c.health.healthy", true] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          runningPercent: {
            $cond: [
              { $gt: ["$total", 0] },
              { $multiply: [{ $divide: ["$running", "$total"] }, 100] },
              null,
            ],
          },
          healthyPercent: {
            $cond: [
              { $gt: ["$total", 0] },
              { $multiply: [{ $divide: ["$healthy", "$total"] }, 100] },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$metadata.monitorId",
          teamId: { $first: "$metadata.teamId" },
          type: { $first: "$metadata.type" },
          count: { $sum: 1 },
          avgResponseTime: { $avg: "$responseTime" },
          dockerRunningPercent: { $avg: "$runningPercent" },
          dockerHealthyPercent: { $avg: "$healthyPercent" },
          dockerTotalContainers: { $last: "$total" },
          dockerRunningContainers: { $last: "$running" },
          dockerHealthyContainers: { $last: "$healthy" },
        },
      },
    ]);

    dockerAgg.forEach((el) =>
      bulkOps.push(this.makeUpsertOp(el, windowStart, windowEnd))
    );

    if (bulkOps.length > 0) {
      const res = await StatsHourly.bulkWrite(bulkOps, { ordered: false });
      upserts += res.upsertedCount + (res.modifiedCount ?? 0);
    }
    return upserts;
  };

  // Placeholder: daily rollup will aggregate from StatsHourly across a day
  rollupDaily = async (
    dayStart: Date,
    dayEnd: Date,
    finalize: boolean = true
  ): Promise<number> => {
    // Fetch hourly docs for the day
    const hourly = await StatsHourly.find({
      windowStart: { $gte: dayStart, $lt: dayEnd },
    })
      .select(
        "monitorId teamId type windowStart count avgResponseTime upChecks downChecks avgResponseTimeUp avgResponseTimeDown accessibility bestPractices seo performance cls si fcp lcp tbt cpu memory disk host net dockerRunningPercent dockerHealthyPercent dockerTotalContainers dockerRunningContainers dockerHealthyContainers"
      )
      .lean();

    type Weighted = { sum: number; w: number };
    const addW = (acc: Weighted, v?: number, w = 0) => {
      if (typeof v === "number" && !Number.isNaN(v) && w > 0) {
        acc.sum += v * w;
        acc.w += w;
      }
    };
    const avg = (acc: Weighted) => (acc.w > 0 ? acc.sum / acc.w : undefined);

    interface DeviceAgg {
      key: string; // device or name
      fields: Record<string, Weighted>;
    }

    interface GroupAgg {
      monitorId: mongoose.Types.ObjectId;
      teamId: mongoose.Types.ObjectId;
      type: string;
      // totals
      count: number;
      upChecks: number;
      downChecks: number;
      // base
      rt: Weighted;
      rtUp: Weighted;
      rtDown: Weighted;
      // pagespeed
      accessibility: Weighted;
      bestPractices: Weighted;
      seo: Weighted;
      performance: Weighted;
      cls: Weighted;
      si: Weighted;
      fcp: Weighted;
      lcp: Weighted;
      tbt: Weighted;
      // infra
      cpu: {
        lastPhysical?: number;
        lastLogical?: number;
        freq: Weighted;
        lastCurrentFreq?: number;
        freePct: Weighted;
        usedPct: Weighted;
        tempSums: number[];
        tempWeights: number[];
      };
      memory: {
        lastTotal?: number;
        lastAvail?: number;
        lastUsed?: number;
        usagePct: Weighted;
      };
      disk: Map<string, DeviceAgg>;
      host: {
        os?: string;
        platform?: string;
        kernel_version?: string;
        pretty_name?: string;
      };
      net: Map<string, DeviceAgg>;
      lastTs: number; // for choosing "last" fields
      // docker
      dockerRunningPercent?: Weighted;
      dockerHealthyPercent?: Weighted;
      dockerTotalContainers?: number;
      dockerRunningContainers?: number;
      dockerHealthyContainers?: number;
    }

    const groups = new Map<string, GroupAgg>();

    for (const h of hourly) {
      const key = (h.monitorId as any).toString();
      let g = groups.get(key);
      if (!g) {
        g = {
          monitorId: h.monitorId as any,
          teamId: h.teamId as any,
          type: h.type,
          count: 0,
          upChecks: 0,
          downChecks: 0,
          rt: { sum: 0, w: 0 },
          rtUp: { sum: 0, w: 0 },
          rtDown: { sum: 0, w: 0 },
          accessibility: { sum: 0, w: 0 },
          bestPractices: { sum: 0, w: 0 },
          seo: { sum: 0, w: 0 },
          performance: { sum: 0, w: 0 },
          cls: { sum: 0, w: 0 },
          si: { sum: 0, w: 0 },
          fcp: { sum: 0, w: 0 },
          lcp: { sum: 0, w: 0 },
          tbt: { sum: 0, w: 0 },
          cpu: {
            freq: { sum: 0, w: 0 },
            freePct: { sum: 0, w: 0 },
            usedPct: { sum: 0, w: 0 },
            tempSums: [],
            tempWeights: [],
          },
          memory: { usagePct: { sum: 0, w: 0 } },
          disk: new Map(),
          host: {},
          net: new Map(),
          lastTs: 0,
        };
        groups.set(key, g);
      }

      const w = h.count ?? 0;
      g.count += w;
      const up = (h as any).upChecks ?? 0;
      const down = (h as any).downChecks ?? 0;
      g.upChecks += up;
      g.downChecks += down;
      addW(g.rt, h.avgResponseTime, w);
      addW(g.rtUp, (h as any).avgResponseTimeUp, up);
      addW(g.rtDown, (h as any).avgResponseTimeDown, down);

      // pagespeed
      addW(g.accessibility, (h as any).accessibility, w);
      addW(g.bestPractices, (h as any).bestPractices, w);
      addW(g.seo, (h as any).seo, w);
      addW(g.performance, (h as any).performance, w);
      addW(g.cls, (h as any).cls, w);
      addW(g.si, (h as any).si, w);
      addW(g.fcp, (h as any).fcp, w);
      addW(g.lcp, (h as any).lcp, w);
      addW(g.tbt, (h as any).tbt, w);

      // docker
      if (!(g as any).dockerRunningPercent)
        (g as any).dockerRunningPercent = { sum: 0, w: 0 };
      if (!(g as any).dockerHealthyPercent)
        (g as any).dockerHealthyPercent = { sum: 0, w: 0 };
      addW(
        (g as any).dockerRunningPercent!,
        (h as any).dockerRunningPercent,
        w
      );
      addW(
        (g as any).dockerHealthyPercent!,
        (h as any).dockerHealthyPercent,
        w
      );

      const ts = new Date(h.windowStart).getTime();
      if (ts >= g.lastTs) {
        g.lastTs = ts;
        // capture last-known fields
        const cpu = (h as any).cpu || {};
        if (typeof cpu.physical_core === "number")
          g.cpu.lastPhysical = cpu.physical_core;
        if (typeof cpu.logical_core === "number")
          g.cpu.lastLogical = cpu.logical_core;
        if (typeof cpu.current_frequency === "number")
          g.cpu.lastCurrentFreq = cpu.current_frequency;

        const mem = (h as any).memory || {};
        if (typeof mem.total_bytes === "number")
          g.memory.lastTotal = mem.total_bytes;
        if (typeof mem.available_bytes === "number")
          g.memory.lastAvail = mem.available_bytes;
        if (typeof mem.used_bytes === "number")
          g.memory.lastUsed = mem.used_bytes;

        const host = (h as any).host || {};
        g.host = {
          os: host.os,
          platform: host.platform,
          kernel_version: host.kernel_version,
          pretty_name: host.pretty_name,
        };

        // docker last snapshot
        (g as any).dockerTotalContainers = (h as any).dockerTotalContainers;
        (g as any).dockerRunningContainers = (h as any).dockerRunningContainers;
        (g as any).dockerHealthyContainers = (h as any).dockerHealthyContainers;
      }

      // weighted CPU averages
      const cpu = (h as any).cpu || {};
      addW(g.cpu.freq, cpu.frequency, w);
      addW(g.cpu.freePct, cpu.free_percent, w);
      addW(g.cpu.usedPct, cpu.used_percent, w);
      const temps: number[] | undefined = cpu.temperature;
      if (Array.isArray(temps)) {
        for (let i = 0; i < temps.length; i++) {
          const v = temps[i];
          if (typeof v === "number") {
            g.cpu.tempSums[i] = (g.cpu.tempSums[i] ?? 0) + v * w;
            g.cpu.tempWeights[i] = (g.cpu.tempWeights[i] ?? 0) + w;
          }
        }
      }

      // memory usage percent weighted
      const mem = (h as any).memory || {};
      addW(g.memory.usagePct, mem.usage_percent, w);

      // disk merge by device
      const disks: any[] | undefined = (h as any).disk;
      if (Array.isArray(disks)) {
        for (const d of disks) {
          const keyD = d.device ?? "";
          if (!g.disk.has(keyD)) {
            g.disk.set(keyD, {
              key: keyD,
              fields: {
                total_bytes: { sum: 0, w: 0 },
                free_bytes: { sum: 0, w: 0 },
                used_bytes: { sum: 0, w: 0 },
                usage_percent: { sum: 0, w: 0 },
                total_inodes: { sum: 0, w: 0 },
                free_inodes: { sum: 0, w: 0 },
                used_inodes: { sum: 0, w: 0 },
                inodes_usage_percent: { sum: 0, w: 0 },
                read_bytes: { sum: 0, w: 0 },
                write_bytes: { sum: 0, w: 0 },
                read_time: { sum: 0, w: 0 },
                write_time: { sum: 0, w: 0 },
              },
            });
          }
          const agg = g.disk.get(keyD)!;
          for (const [f, acc] of Object.entries(agg.fields)) {
            const val = (d as any)[f];
            if (typeof val === "number") addW(acc as Weighted, val, w);
          }
        }
      }

      // net merge by name
      const nets: any[] | undefined = (h as any).net;
      if (Array.isArray(nets)) {
        for (const n of nets) {
          const keyN = n.name ?? "";
          if (!g.net.has(keyN)) {
            g.net.set(keyN, {
              key: keyN,
              fields: {
                bytes_sent: { sum: 0, w: 0 },
                bytes_recv: { sum: 0, w: 0 },
                packets_sent: { sum: 0, w: 0 },
                packets_recv: { sum: 0, w: 0 },
                err_in: { sum: 0, w: 0 },
                err_out: { sum: 0, w: 0 },
                drop_in: { sum: 0, w: 0 },
                drop_out: { sum: 0, w: 0 },
                fifo_in: { sum: 0, w: 0 },
                fifo_out: { sum: 0, w: 0 },
              },
            });
          }
          const agg = g.net.get(keyN)!;
          for (const [f, acc] of Object.entries(agg.fields)) {
            const val = (n as any)[f];
            if (typeof val === "number") addW(acc as Weighted, val, w);
          }
        }
      }
    }

    // Prepare bulk upserts for daily
    const bulkOps: any[] = [];
    for (const g of groups.values()) {
      const cpuTemps: number[] | undefined = g.cpu.tempSums
        .map((s, i) => {
          const w = g.cpu.tempWeights[i] ?? 0;
          return w > 0 ? s / w : undefined;
        })
        .filter((v) => typeof v === "number") as number[];

      const diskArr = Array.from(g.disk.values()).map((d) => {
        const o: any = { device: d.key };
        for (const [f, acc] of Object.entries(d.fields)) {
          const v = avg(acc as Weighted);
          if (typeof v === "number") o[f] = v;
        }
        return o;
      });

      const netArr = Array.from(g.net.values()).map((n) => {
        const o: any = { name: n.key };
        for (const [f, acc] of Object.entries(n.fields)) {
          const v = avg(acc as Weighted);
          if (typeof v === "number") o[f] = v;
        }
        return o;
      });

      const cpu: any = {
        physical_core: g.cpu.lastPhysical,
        logical_core: g.cpu.lastLogical,
        frequency: avg(g.cpu.freq),
        current_frequency: g.cpu.lastCurrentFreq,
        free_percent: avg(g.cpu.freePct),
        used_percent: avg(g.cpu.usedPct),
      };
      if (cpuTemps.length > 0) cpu.temperature = cpuTemps;

      const memory: any = {
        total_bytes: g.memory.lastTotal,
        available_bytes: g.memory.lastAvail,
        used_bytes: g.memory.lastUsed,
        usage_percent: avg(g.memory.usagePct),
      };

      const updateDoc: any = {
        $setOnInsert: {
          monitorId: g.monitorId,
          teamId: g.teamId,
          type: g.type,
          windowStart: dayStart,
          windowEnd: dayEnd,
        },
        $set: {
          finalized: finalize,
          count: g.count,
          upChecks: g.upChecks,
          downChecks: g.downChecks,
          avgResponseTime: avg(g.rt) ?? 0,
          avgResponseTimeUp: (avg(g.rtUp) ?? null) as any,
          avgResponseTimeDown: (avg(g.rtDown) ?? null) as any,
          accessibility: avg(g.accessibility),
          bestPractices: avg(g.bestPractices),
          seo: avg(g.seo),
          performance: avg(g.performance),
          cls: avg(g.cls),
          si: avg(g.si),
          fcp: avg(g.fcp),
          lcp: avg(g.lcp),
          tbt: avg(g.tbt),
          cpu,
          memory,
          disk: diskArr.length > 0 ? diskArr : undefined,
          host: g.host,
          net: netArr.length > 0 ? netArr : undefined,
          dockerRunningPercent: avg((g as any).dockerRunningPercent!),
          dockerHealthyPercent: avg((g as any).dockerHealthyPercent!),
          dockerTotalContainers: (g as any).dockerTotalContainers,
          dockerRunningContainers: (g as any).dockerRunningContainers,
          dockerHealthyContainers: (g as any).dockerHealthyContainers,
        },
      };

      bulkOps.push({
        updateOne: {
          filter: { monitorId: g.monitorId, windowStart: dayStart },
          update: updateDoc,
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      const res = await StatsDaily.bulkWrite(bulkOps, { ordered: false });
      return res.upsertedCount + (res.modifiedCount ?? 0);
    }
    return 0;
  };
}

export default StatsAggregationService;
