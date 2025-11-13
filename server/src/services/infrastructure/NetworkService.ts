import { Got, HTTPError } from "got";
import got from "got";
import ping from "ping";
import { IMonitor } from "@/db/models/index.js";
import { GotTimings } from "@/db/models/checks/Check.js";
import type { Response } from "got";
import type {
  ISystemInfo,
  ICaptureInfo,
  ILighthouseResult,
} from "@/db/models/index.js";
import { MonitorType, MonitorStatus } from "@/db/models/monitors/Monitor.js";
import ApiError from "@/utils/ApiError.js";
import { config } from "@/config/index.js";
import CacheableLookup from "cacheable-lookup";
import http from "http";
import https from "https";

const SERVICE_NAME = "NetworkService";
export interface INetworkService {
  requestHttp: (monitor: IMonitor) => Promise<StatusResponse>;
  requestInfrastructure: (monitor: IMonitor) => Promise<StatusResponse>;
  requestStatus: (monitor: IMonitor) => Promise<StatusResponse>;
  requestPagespeed: (monitor: IMonitor) => Promise<StatusResponse>;
  requestPing: (monitor: IMonitor) => Promise<StatusResponse>;
}

export interface ICapturePayload {
  data: ISystemInfo;
  capture: ICaptureInfo;
}

export interface ILighthousePayload {
  lighthouseResult: ILighthouseResult;
}

export interface StatusResponse<TPayload = unknown> {
  monitorId: string;
  teamId: string;
  type: MonitorType;
  code?: number;
  status: MonitorStatus;
  message: string;
  responseTime: number;
  timings?: GotTimings;
  payload?: TPayload;
}

class NetworkService implements INetworkService {
  public SERVICE_NAME = SERVICE_NAME;
  private got: Got;
  private NETWORK_ERROR: number;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.NETWORK_ERROR = 5000;

    const cacheable = new CacheableLookup();

    this.got = got.extend({
      dnsCache: cacheable,
      timeout: {
        request: 30000,
      },
      retry: { limit: 1 },
    });
  }

  private buildStatusResponse = <T>(
    monitor: IMonitor,
    response: Response<T> | null,
    error: any | null
  ): StatusResponse<T> => {
    if (error) {
      const statusResponse: StatusResponse<T> = {
        monitorId: monitor._id.toString(),
        teamId: monitor.teamId.toString(),
        type: monitor.type,
        status: "down" as MonitorStatus,
        code: this.NETWORK_ERROR,
        message: error.message || "Network error",
        responseTime: 0,
        timings: { phases: {} } as GotTimings,
      };
      if (error instanceof HTTPError) {
        statusResponse.code = error?.response?.statusCode || this.NETWORK_ERROR;
        statusResponse.message = error.message || "HTTP error";
        statusResponse.responseTime = error.timings?.phases?.total || 0;
        statusResponse.timings = error.timings;
      }
      return statusResponse;
    }

    const statusResponse: StatusResponse<T> = {
      monitorId: monitor._id.toString(),
      teamId: monitor.teamId.toString(),
      type: monitor.type,
      code: response?.statusCode || this.NETWORK_ERROR,
      status: response?.ok === true ? "up" : "down",
      message: response?.statusMessage || "",
      responseTime: response?.timings?.phases?.total || 0,
      timings: response?.timings || ({ phases: {} } as GotTimings),
    };

    return statusResponse;
  };

  requestHttp = async (monitor: IMonitor) => {
    try {
      const url = monitor.url;
      if (!url) {
        throw new Error("No URL provided");
      }

      try {
        const response: Response = await this.got(url);
        return this.buildStatusResponse(monitor, response, null);
      } catch (error) {
        return this.buildStatusResponse(monitor, null, error);
      }
    } catch (error) {
      throw error;
    }
  };

  requestInfrastructure = async (monitor: IMonitor) => {
    const url = monitor.url;
    if (!url) {
      throw new Error("No URL provided");
    }
    const secret = monitor.secret;
    if (!secret) {
      throw new Error("No secret provided for infrastructure monitor");
    }

    let statusResponse: StatusResponse<ICapturePayload>;
    try {
      const response: Response<ICapturePayload> | null = await this.got(url, {
        headers: { Authorization: `Bearer ${secret}` },
        responseType: "json",
      });

      statusResponse = this.buildStatusResponse(monitor, response, null);
      if (!response?.body) {
        throw new ApiError(
          "No payload received from infrastructure monitor",
          500
        );
      }
      statusResponse.payload = response?.body;
      return statusResponse;
    } catch (error) {
      statusResponse = this.buildStatusResponse(monitor, null, error);
    }
    return statusResponse;
  };

  requestPagespeed = async (monitor: IMonitor) => {
    const apiKey = config.PAGESPEED_API_KEY;
    if (!apiKey) {
      throw new Error("No API key provided for pagespeed monitor");
    }
    const url = monitor.url;
    if (!url) {
      throw new Error("No URL provided");
    }

    let statusResponse: StatusResponse<ILighthousePayload>;

    try {
      const response: Response = await this.got(url);
      statusResponse = this.buildStatusResponse(
        monitor,
        response,
        null
      ) as StatusResponse<ILighthousePayload>;
    } catch (error) {
      statusResponse = this.buildStatusResponse(monitor, null, error);
    }

    const pagespeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&category=seo&category=accessibility&category=best-practices&category=performance&key=${apiKey}`;
    const pagespeedResponse = await this.got<ILighthousePayload>(pagespeedUrl, {
      responseType: "json",
    });
    const payload = pagespeedResponse.body;
    if (payload) {
      statusResponse.payload = payload;
      return statusResponse;
    } else {
      throw new ApiError("No payload received from pagespeed monitor", 500);
    }
  };

  requestPing = async (monitor: IMonitor) => {
    const response = await ping.promise.probe(monitor.url);
    const status = response?.alive === true ? "up" : "down";

    const rawTime =
      typeof response?.time === "string"
        ? parseFloat(response.time)
        : Number(response?.time);
    const responseTime = Number.isFinite(rawTime) ? rawTime : 0;

    return {
      monitorId: monitor._id.toString(),
      teamId: monitor.teamId.toString(),
      type: monitor.type,
      status: status as MonitorStatus,
      message: "Ping successful",
      responseTime,
      timings: { phases: {} } as GotTimings,
    };
  };

  requestStatus = async (monitor: IMonitor) => {
    switch (monitor?.type) {
      case "http":
        return await this.requestHttp(monitor); // uses GOT
      case "https":
        return await this.requestHttp(monitor); // uses GOT
      case "infrastructure":
        return await this.requestInfrastructure(monitor); // uses GOT
      case "pagespeed":
        return await this.requestPagespeed(monitor); // uses GOT
      case "ping":
        return await this.requestPing(monitor); // uses PING
      default:
        throw new Error("Not implemented");
    }
  };
}

export default NetworkService;
