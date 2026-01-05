import { ICheck, Check, Monitor, ISystemInfo } from "@/db/models/index.js";
import type { IDockerPayload } from "@/services/infrastructure/NetworkService.js";
import { MonitorStatus, MonitorType } from "@/types/domain/index.js";
import { StatusResponse } from "../infrastructure/NetworkService.js";
import type {
  ICapturePayload,
  ILighthousePayload,
} from "../infrastructure/NetworkService.js";
import mongoose from "mongoose";
import ApiError from "@/utils/ApiError.js";
import { getChildLogger } from "@/logger/Logger.js";
import { getStartDate } from "@/utils/TimeUtils.js";

const SERVICE_NAME = "CheckService";
const logger = getChildLogger(SERVICE_NAME);

export interface ICheckService {
  buildCheck: (
    statusResponse: StatusResponse,
    type: MonitorType
  ) => Promise<ICheck>;
  getMonitorChecks: (
    monitorId: string,
    page: number,
    rowsPerPage: number
  ) => Promise<{ checks: ICheck[]; count: number }>;
  getChecksByStatus: (
    status: MonitorStatus,
    teamId: string,
    monitorId: string,
    page: number,
    rowsPerPage: number,
    range: string
  ) => Promise<{ checks: ICheck[]; hasMore: boolean }>;

  getCheckById: (checkId: string, teamId: string) => Promise<ICheck | null>;

  cleanupOrphanedChecks: () => Promise<boolean>;
}

class CheckService implements ICheckService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  private isCapturePayload = (payload: any): payload is ICapturePayload => {
    if (!payload || typeof payload !== "object") return false;

    if (!("data" in payload) || typeof payload.data !== "object") {
      return false;
    }

    const data = payload.data as Partial<ISystemInfo>;
    if (
      !data.cpu ||
      typeof data.cpu !== "object" ||
      typeof data.cpu.usage_percent !== "number"
    ) {
      return false;
    }

    if (
      !data.memory ||
      typeof data.memory !== "object" ||
      typeof data.memory.usage_percent !== "number"
    ) {
      return false;
    }

    if (data.disk && !Array.isArray(data.disk)) {
      return false;
    }
    if (data.net && !Array.isArray(data.net)) {
      return false;
    }

    if (!("capture" in payload) || typeof payload.capture !== "object")
      return false;
    const capture = payload.capture as Record<string, any>;
    if (typeof capture.version !== "string" || typeof capture.mode !== "string")
      return false;

    return true;
  };

  private isPagespeedPayload = (
    payload: any
  ): payload is ILighthousePayload => {
    if (!payload || typeof payload !== "object") return false;

    if (
      !("lighthouseResult" in payload) ||
      typeof payload.lighthouseResult !== "object"
    ) {
      return false;
    }
    return true;
  };

  private isDockerPayload = (payload: any): payload is IDockerPayload => {
    if (!payload || typeof payload !== "object") return false;
    if (!Array.isArray((payload as any).data)) return false;
    // Spot-check a couple of properties on the first element if present
    const first = (payload as any).data[0];
    if (first) {
      if (typeof first !== "object") return false;
      if (
        typeof first.container_id !== "string" ||
        typeof first.container_name !== "string"
      ) {
        return false;
      }
    }
    if (!("capture" in payload) || typeof (payload as any).capture !== "object")
      return false;
    return true;
  };

  private buildBaseCheck = (statusResponse: StatusResponse) => {
    const monitorId = new mongoose.Types.ObjectId(statusResponse.monitorId);
    const teamId = new mongoose.Types.ObjectId(statusResponse.teamId);
    const checkData: Partial<ICheck> = {
      metadata: {
        monitorId: monitorId,
        teamId: teamId,
        type: statusResponse?.type,
      },
      status: statusResponse?.status,
      httpStatusCode: statusResponse?.code,
      message: statusResponse?.message,
      responseTime: statusResponse?.responseTime,
      timings: statusResponse?.timings,
    };

    const check: ICheck = new Check(checkData);
    return check;
  };

  private buildInfrastructureCheck = (
    statusResponse: StatusResponse<ICapturePayload>
  ) => {
    const code = statusResponse?.code;
    if (code && (code < 200 || code >= 300)) {
      throw new Error(statusResponse?.message || "Bad monitor response");
    }
    if (!this.isCapturePayload(statusResponse.payload)) {
      throw new Error("Invalid payload for infrastructure monitor");
    }
    const check = this.buildBaseCheck(statusResponse);
    check.system = statusResponse.payload.data;
    check.capture = statusResponse.payload.capture;
    return check;
  };

  private buildPagespeedCheck = (
    statusResponse: StatusResponse<ILighthousePayload>
  ) => {
    if (!this.isPagespeedPayload(statusResponse.payload)) {
      throw new Error("Invalid payload for pagespeed monitor");
    }
    const check = this.buildBaseCheck(statusResponse);
    const lighthouseResult = statusResponse?.payload?.lighthouseResult;
    check.lighthouse = {
      accessibility: lighthouseResult?.categories?.accessibility?.score || 0,
      bestPractices:
        lighthouseResult?.categories?.["best-practices"]?.score || 0,
      seo: lighthouseResult?.categories?.seo?.score || 0,
      performance: lighthouseResult?.categories?.performance?.score || 0,
      audits: {
        cls: lighthouseResult?.audits?.["cumulative-layout-shift"] || {},
        si: lighthouseResult?.audits?.["speed-index"] || {},
        fcp: lighthouseResult?.audits?.["first-contentful-paint"] || {},
        lcp: lighthouseResult?.audits?.["largest-contentful-paint"] || {},
        tbt: lighthouseResult?.audits?.["total-blocking-time"] || {},
      },
    };
    return check;
  };

  private buildDockerCheck = (
    statusResponse: StatusResponse<IDockerPayload>
  ) => {
    const code = statusResponse?.code;
    if (code && (code < 200 || code >= 300)) {
      throw new Error(statusResponse?.message || "Bad monitor response");
    }
    if (!this.isDockerPayload(statusResponse.payload)) {
      throw new Error("Invalid payload for docker monitor");
    }
    const check = this.buildBaseCheck(statusResponse);
    check.dockerContainers = statusResponse.payload.data || [];
    check.capture = statusResponse.payload.capture;
    return check;
  };

  buildCheck = async (
    statusResponse: StatusResponse,
    type: MonitorType
  ): Promise<ICheck> => {
    switch (type) {
      case "infrastructure":
        return this.buildInfrastructureCheck(
          statusResponse as StatusResponse<ICapturePayload>
        );
      case "docker":
        return this.buildDockerCheck(
          statusResponse as StatusResponse<IDockerPayload>
        );

      case "pagespeed":
        return this.buildPagespeedCheck(
          statusResponse as StatusResponse<ILighthousePayload>
        );
      case "http":
      case "https":
        return this.buildBaseCheck(statusResponse);

      case "ping":
        return this.buildBaseCheck(statusResponse);
      case "port":
        return this.buildBaseCheck(statusResponse);
      default:
        throw new Error(`Unsupported monitor type: ${type}`);
    }
  };

  cleanupOrphanedChecks = async () => {
    try {
      const monitorIds = await Monitor.find().distinct("_id");
      const result = await Check.deleteMany({
        "metadata.monitorId": { $nin: monitorIds },
      });
      logger.info(`Deleted ${result.deletedCount} orphaned Checks.`);
      return true;
    } catch (error) {
      logger.error("Error cleaning up orphaned Checks:", error);
      return false;
    }
  };

  getMonitorChecks = async (
    monitorId: string,
    page: number,
    rowsPerPage: number
  ) => {
    const count = await Check.countDocuments({
      "metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
    });

    const checks = await Check.find({
      "metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
    })
      .sort({ createdAt: -1 })
      .skip(page * rowsPerPage)
      .limit(rowsPerPage);
    return { checks, count };
  };

  getChecksByStatus = async (
    status: MonitorStatus,
    teamId: string,
    monitorId: string,
    page: number,
    rowsPerPage: number,
    range: string
  ) => {
    let match;
    const startDate = getStartDate(range);

    if (monitorId) {
      const authorized = await Monitor.exists({
        _id: monitorId,
        teamId,
      });
      if (!authorized) {
        throw new ApiError("Not authorized", 403);
      }

      match = {
        status,
        "metadata.teamId": new mongoose.Types.ObjectId(teamId),
        "metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
        createdAt: { $gte: startDate, $lte: new Date() },
      };
    } else {
      match = {
        status,
        "metadata.teamId": new mongoose.Types.ObjectId(teamId),
        createdAt: { $gte: startDate, $lte: new Date() },
      };
    }

    const pageSizePlusOne = rowsPerPage + 1;
    const docs = await Check.find(match)
      .sort({ createdAt: -1 })
      .skip(page * rowsPerPage)
      .limit(pageSizePlusOne)
      .select({
        _id: 1,
        status: 1,
        httpStatusCode: 1,
        message: 1,
        responseTime: 1,
        createdAt: 1,
        "metadata.monitorId": 1,
        "metadata.teamId": 1,
        "metadata.type": 1,
      });

    const hasMore = docs.length > rowsPerPage;
    const limited = hasMore ? docs.slice(0, rowsPerPage) : docs;

    const monitorIds = Array.from(
      new Set(
        limited
          .map((d) => d?.metadata?.monitorId)
          .filter((v): v is mongoose.Types.ObjectId => !!v)
          .map((v) => v.toString())
      )
    );

    let nameById = new Map<string, string>();
    if (monitorIds.length > 0) {
      const monitors = await Monitor.find({ _id: { $in: monitorIds } }).select({
        _id: 1,
        name: 1,
      });
      nameById = new Map(monitors.map((m) => [m._id.toString(), m.name]));
    }

    const checks = limited.map((doc) => {
      const asObj = doc.toObject();
      const idStr = asObj?.metadata?.monitorId?.toString?.() ?? "";
      const name = idStr ? nameById.get(idStr) : undefined;
      if (name) {
        asObj.metadata = asObj.metadata || {};
        (asObj.metadata as any).monitorId = { name } as any;
      }
      return asObj as ICheck;
    });

    return { checks, hasMore };
  };

  getCheckById = async (checkId: string, teamId: string) => {
    return await Check.findOne({
      _id: new mongoose.Types.ObjectId(checkId),
      "metadata.teamId": new mongoose.Types.ObjectId(teamId),
    });
  };
}

export default CheckService;
