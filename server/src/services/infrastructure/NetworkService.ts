import { Got, HTTPError } from "got";
import ping from "ping";
import net from "net";
import { IMonitor } from "@/db/models/index.js";
import { GotTimings } from "@/db/models/checks/Check.js";
import type { Response } from "got";
import type {
  ISystemInfo,
  ICaptureInfo,
  ILighthouseResult,
} from "@/db/models/index.js";
import type { TLSSocket, DetailedPeerCertificate } from "node:tls";
import type { ClientRequest } from "node:http";
import { MonitorType, MonitorStatus } from "@/db/models/monitors/Monitor.js";
import ApiError from "@/utils/ApiError.js";
import { config } from "@/config/index.js";
import CacheableLookup from "cacheable-lookup";
import { getChildLogger } from "@/logger/Logger.js";
const SERVICE_NAME = "NetworkService";
const logger = getChildLogger(SERVICE_NAME);
export interface INetworkService {
  requestHttp: (monitor: IMonitor) => Promise<StatusResponse>;
  requestInfrastructure: (monitor: IMonitor) => Promise<StatusResponse>;
  requestStatus: (monitor: IMonitor) => Promise<StatusResponse>;
  requestPagespeed: (monitor: IMonitor) => Promise<StatusResponse>;
  requestPing: (monitor: IMonitor) => Promise<StatusResponse>;
  requestPort: (monitor: IMonitor) => Promise<StatusResponse>;
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
  certificateExpiry?: Date | null;
}

class NetworkService implements INetworkService {
  public SERVICE_NAME = SERVICE_NAME;
  private client: Got;
  private NETWORK_ERROR: number;
  constructor(got: Got) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.NETWORK_ERROR = 5000;

    const cacheable = new CacheableLookup();

    this.client = got.extend({
      dnsCache: cacheable,
      timeout: {
        request: 30000,
      },
      retry: { limit: 1 },
      http2: false,
    });
  }

  private buildStatusResponse = <T>(
    monitor: IMonitor,
    response: Response<T> | null,
    certificateExpiryOrError?: Date | null | any,
    maybeError?: any | null
  ): StatusResponse<T> => {
    // Support both call styles:
    // - buildStatusResponse(monitor, response, error)
    // - buildStatusResponse(monitor, response, certificateExpiry, error)
    let certificateExpiry: Date | null = null;
    let error: any | null = null;
    if (
      certificateExpiryOrError instanceof Date ||
      certificateExpiryOrError === null
    ) {
      certificateExpiry = certificateExpiryOrError ?? null;
      error = maybeError ?? null;
    } else if (typeof certificateExpiryOrError !== "undefined") {
      error = certificateExpiryOrError;
    }
    if (error) {
      const statusResponse: StatusResponse<T> = {
        monitorId: monitor._id.toString(),
        teamId: monitor.teamId.toString(),
        type: monitor.type,
        status: "down" as MonitorStatus,
        code: this.NETWORK_ERROR,
        message: (error && error.message) || "Network error",
        responseTime: 0,
        timings: { phases: {} } as GotTimings,
        certificateExpiry,
      };
      if (error instanceof HTTPError) {
        statusResponse.code = error?.response?.statusCode || this.NETWORK_ERROR;
        statusResponse.message = (error && error.message) || "HTTP error";
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
      certificateExpiry,
    };

    return statusResponse;
  };

  requestHttp = async (monitor: IMonitor) => {
    try {
      const url = monitor.url;
      if (!url) {
        throw new Error("No URL provided");
      }

      let certificateExpiry: Date | null = null;
      try {
        const isHttps = url.startsWith("https://");
        const haveRejectFlag =
          isHttps && typeof (monitor as any).rejectUnauthorized !== "undefined";
        const req: any = haveRejectFlag
          ? this.client(url, {
              https: {
                rejectUnauthorized: (monitor as any).rejectUnauthorized,
              },
            })
          : this.client(url);
        req.on("request", (nodeReq: ClientRequest) => {
          nodeReq.on("socket", (socket: any) => {
            const capture = () => {
              try {
                if (typeof socket.getPeerCertificate === "function") {
                  const cert = socket.getPeerCertificate(true);
                  if (cert && cert.valid_to) {
                    certificateExpiry = new Date(cert.valid_to);
                  }
                }
              } catch (_) {
                // Non-TLS or unsupported socket; ignore
              }
            };
            capture();
            if (typeof socket.once === "function") {
              socket.once("secureConnect", capture);
            }
          });
        });
        const response: Response = await req;
        return this.buildStatusResponse(
          monitor,
          response,
          certificateExpiry,
          null
        );
      } catch (error) {
        return this.buildStatusResponse(
          monitor,
          null,
          certificateExpiry,
          error
        );
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
      const response: Response<ICapturePayload> | null = await this.client(
        url,
        {
          headers: { Authorization: `Bearer ${secret}` },
          responseType: "json",
        }
      );

      statusResponse = this.buildStatusResponse(monitor, response, null, null);
      if (!response?.body) {
        throw new ApiError(
          "No payload received from infrastructure monitor",
          500
        );
      }
      statusResponse.payload = response?.body;
      return statusResponse;
    } catch (error) {
      statusResponse = this.buildStatusResponse(monitor, null, null, error);
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
      const response: Response = await this.client(url);
      statusResponse = this.buildStatusResponse(
        monitor,
        response,
        null,
        null
      ) as StatusResponse<ILighthousePayload>;
    } catch (error) {
      statusResponse = this.buildStatusResponse(monitor, null, null, error);
    }

    const pagespeedUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&category=seo&category=accessibility&category=best-practices&category=performance&key=${apiKey}`;
    const pagespeedResponse = await this.client<ILighthousePayload>(
      pagespeedUrl,
      {
        responseType: "json",
      }
    );
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

  requestPort = async (monitor: IMonitor) => {
    const response = {
      monitorId: monitor._id.toString(),
      teamId: monitor.teamId.toString(),
      type: monitor.type,
      status: "down" as MonitorStatus,
      message: "Port check failed",
      responseTime: 0,
      timings: { phases: {} } as GotTimings,
    };

    try {
      const host = monitor.url;
      const port = monitor.port;
      if (!port) {
        throw new Error("No port provided for port monitor");
      }

      const { status, responseTime, message } = await new Promise<{
        status: MonitorStatus;
        responseTime: number;
        message: string;
      }>((resolve) => {
        const start = performance.now();
        const socket = net.createConnection({
          host,
          port,
        });

        socket.setTimeout(5000);

        socket.on("connect", () => {
          socket.destroy();
          const duration = Math.round(performance.now() - start);
          resolve({
            status: "up",
            responseTime: duration,
            message: "Port is open",
          });
        });

        socket.on("error", (err) => {
          socket.destroy();
          const duration = Math.round(performance.now() - start);
          resolve({
            status: "down",
            responseTime: duration,
            message: err.message,
          });
        });

        socket.on("timeout", () => {
          socket.destroy();
          const duration = Math.round(performance.now() - start);
          resolve({
            status: "down",
            responseTime: duration,
            message: "Port check timed out",
          });
        });
      });

      response.status = status;
      response.responseTime = responseTime;
      response.message = message;
    } catch (error) {
      console.error(error);
    } finally {
      return response;
    }
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
      case "port":
        return await this.requestPort(monitor);
      default:
        throw new Error("Not implemented");
    }
  };
}

export default NetworkService;
