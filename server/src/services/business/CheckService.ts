import { ISystemInfo } from "@/types/domain/index.js";
import type { IDockerPayload } from "@/services/infrastructure/NetworkService.js";
import { MonitorStatus, MonitorType } from "@/types/domain/index.js";
import { StatusResponse } from "@/services/infrastructure/NetworkService.js";
import type {
  ICapturePayload,
  ILighthousePayload,
} from "@/services/infrastructure/NetworkService.js";
import ApiError from "@/utils/ApiError.js";
import { getChildLogger } from "@/logger/Logger.js";
import { getStartDate } from "@/utils/TimeUtils.js";

import type { CheckEntity } from "@/types/domain/index.js";
import type {
  IChecksRepository,
  IMonitorRepository,
} from "@/repositories/index.js";

const SERVICE_NAME = "CheckService";
const logger = getChildLogger(SERVICE_NAME);

export interface ICheckService {
  createCheck: (checkData: Partial<CheckEntity>) => Promise<CheckEntity>;
  buildCheck: (
    statusResponse: StatusResponse,
    type: MonitorType
  ) => Promise<Partial<CheckEntity>>;
  getMonitorChecks: (
    monitorId: string,
    page: number,
    rowsPerPage: number
  ) => Promise<{ checks: CheckEntity[]; count: number }>;
  getChecksByStatus: (
    status: MonitorStatus,
    teamId: string,
    monitorId: string,
    page: number,
    rowsPerPage: number,
    range: string
  ) => Promise<{ checks: CheckEntity[]; hasMore: boolean }>;

  getCheckById: (
    checkId: string,
    teamId: string
  ) => Promise<CheckEntity | null>;

  cleanupOrphanedChecks: () => Promise<boolean>;
}

class CheckService implements ICheckService {
  public SERVICE_NAME: string;
  private checksRepository: IChecksRepository;
  private monitorRepository: IMonitorRepository;
  constructor(
    checksRepository: IChecksRepository,
    monitorRepository: IMonitorRepository
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.checksRepository = checksRepository;
    this.monitorRepository = monitorRepository;
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
    const check: Partial<CheckEntity> = {
      monitorId: statusResponse.monitorId,
      teamId: statusResponse.teamId,
      type: statusResponse?.type,
      status: statusResponse?.status,
      httpStatusCode: statusResponse?.code,
      message: statusResponse?.message,
      responseTime: statusResponse?.responseTime,
      timings: statusResponse?.timings,
    };

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

  createCheck = async (checkData: Partial<CheckEntity>) => {
    const check = await this.checksRepository.create(checkData);
    return check;
  };

  buildCheck = async (
    statusResponse: StatusResponse,
    type: MonitorType
  ): Promise<Partial<CheckEntity>> => {
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
      const monitorIds = (await this.monitorRepository.findAll()).map(
        (m) => m.id
      );
      const deletedCount =
        await this.checksRepository.deleteManyExcludedByMonitorIds(monitorIds);
      logger.info(`Deleted ${deletedCount} orphaned Checks.`);
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
    const count = await this.checksRepository.findCountByMonitorId(monitorId);

    const checks = await this.checksRepository.findPageByMonitorId(
      monitorId,
      page,
      rowsPerPage
    );
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
    const startDate = getStartDate(range);

    let checks: CheckEntity[] = [];
    if (monitorId) {
      const authorized = await this.monitorRepository.findById(
        monitorId,
        teamId
      );

      if (!authorized) {
        throw new ApiError("Not authorized", 403);
      }
      checks = await this.checksRepository.findByMonitorIdAndStatus(
        status,
        teamId,
        monitorId,
        startDate,
        page,
        rowsPerPage
      );
    } else {
      checks = await this.checksRepository.findByTeamIdAndStatus(
        status,
        teamId,
        startDate,
        page,
        rowsPerPage
      );
    }

    const hasMore = checks.length > rowsPerPage;

    return { checks, hasMore };
  };

  getCheckById = async (checkId: string, teamId: string) => {
    return await this.checksRepository.findById(checkId, teamId);
  };
}

export default CheckService;
