import type { IMonitor } from "@/db/models/monitors/Monitor.js";
import NetworkService from "@/services/infrastructure/NetworkService.js";
import type { StatusResponse } from "@/services/infrastructure/NetworkService.js";
import type { Response } from "got";
import type { Got } from "got";
import { Types } from "mongoose";

jest.mock("got", () => {
  const extend = jest.fn();

  class MockHTTPError extends Error {
    public response?: any;
    public timings?: any;
    constructor(message?: string, options: any = {}) {
      super(message);
      this.response = options.response;
      this.timings = options.timings;
    }
  }

  return {
    __esModule: true,
    default: { extend },
    HTTPError: MockHTTPError,
  };
});

jest.mock("cacheable-lookup", () => ({
  __esModule: true,
  default: class CacheableLookup {},
}));

const getGotModule = () => jest.requireMock("got");

const buildMonitor = (overrides: Partial<IMonitor> = {}): IMonitor =>
  ({
    _id: new Types.ObjectId(),
    teamId: new Types.ObjectId(),
    type: "http" as any,
    url: "https://example.com",
    secret: "secret",
    interval: 60000,
    isActive: true,
    status: "up",
    n: 1,
    latestChecks: [],
    save: jest.fn(),
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IMonitor);

const createService = (clientMock?: jest.Mock) => {
  const gotModule = getGotModule();
  const extendMock = gotModule.default.extend as jest.Mock;
  const requestMock = clientMock ?? jest.fn();
  extendMock.mockReturnValue(requestMock);
  const service = new NetworkService(gotModule.default as unknown as Got);
  return { service, requestMock, extendMock, gotModule };
};

const invokeBuildStatusResponse = <T>(
  service: NetworkService,
  monitor: IMonitor,
  response: Response<T> | null,
  error: any | null
) =>
  (service as unknown as {
    buildStatusResponse: (
      monitor: IMonitor,
      response: Response<T> | null,
      error: any | null
    ) => StatusResponse<T>;
  }).buildStatusResponse(monitor, response, error);

beforeEach(() => {
  const gotModule = getGotModule();
  (gotModule.default.extend as jest.Mock).mockReset();
});

describe("NetworkService.buildStatusResponse", () => {
  it("maps successful response details", () => {
    const { service } = createService();
    const timings = {
      phases: { total: 321 },
    } as Response["timings"];
    const response = {
      statusCode: 201,
      statusMessage: "Accepted",
      ok: true,
      timings,
    } as Response;
    const monitor = buildMonitor();

    const result = invokeBuildStatusResponse(service, monitor, response, null);

    expect(result.monitorId).toBe(monitor._id.toString());
    expect(result.teamId).toBe(monitor.teamId.toString());
    expect(result.type).toBe(monitor.type);
    expect(result.code).toBe(201);
    expect(result.status).toBe("up");
    expect(result.message).toBe("Accepted");
    expect(result.responseTime).toBe(321);
    expect(result.timings).toBe(timings);
  });

  it("returns default error payload for generic failures", () => {
    const { service } = createService();
    const monitor = buildMonitor();
    const error = new Error("timeout");

    const result = invokeBuildStatusResponse(service, monitor, null, error);

    expect(result.monitorId).toBe(monitor._id.toString());
    expect(result.status).toBe("down");
    expect(result.code).toBe(5000);
    expect(result.message).toBe("timeout");
    expect(result.responseTime).toBe(0);
    expect(result.timings).toEqual({ phases: {} });
  });

  it("honors HTTPError metadata", () => {
    const { service, gotModule } = createService();
    const { HTTPError } = gotModule;
    const monitor = buildMonitor();
    const timings = { phases: { total: 987 } };
    const httpError = new HTTPError("Bad Gateway", {
      response: { statusCode: 502 },
      timings,
    });

    const result = invokeBuildStatusResponse(service, monitor, null, httpError);

    expect(result.status).toBe("down");
    expect(result.code).toBe(502);
    expect(result.message).toBe("Bad Gateway");
    expect(result.responseTime).toBe(987);
    expect(result.timings).toBe(timings);
  });
});

describe("NetworkService.requestHttp", () => {
  it("requests monitor URL and maps successful response", async () => {
    const timings = { phases: { total: 123 } } as Response["timings"];
    const response = {
      statusCode: 204,
      statusMessage: "No Content",
      ok: true,
      timings,
    } as Response;
    const requestMock = jest.fn().mockResolvedValue(response);
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({ url: "https://api.example.com" });

    const result = await service.requestHttp(monitor);

    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("https://api.example.com");
    expect(result.status).toBe("up");
    expect(result.code).toBe(204);
    expect(result.message).toBe("No Content");
    expect(result.responseTime).toBe(123);
    expect(result.timings).toBe(timings);
  });

  it("throws when monitor is missing a URL", async () => {
    const requestMock = jest.fn();
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({ url: undefined as unknown as string });

    await expect(service.requestHttp(monitor)).rejects.toThrow("No URL provided");
    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("returns fallback response when request throws", async () => {
    const error = new Error("connection reset");
    const requestMock = jest.fn().mockRejectedValue(error);
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({ url: "https://api.example.com" });

    const result = await service.requestHttp(monitor);

    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("https://api.example.com");
    expect(result.status).toBe("down");
    expect(result.code).toBe(5000);
    expect(result.message).toBe("connection reset");
    expect(result.responseTime).toBe(0);
    expect(result.timings).toEqual({ phases: {} });
  });
});

// requestInfrastructure block covers success path and every guard/exception branch so all lines execute.
describe("NetworkService.requestInfrastructure", () => {
  it("requests infrastructure endpoint with auth header and attaches payload", async () => {
    const body = { data: { cpu: 10 }, capture: { version: "1" } };
    const timings = { phases: { total: 456 } } as Response["timings"];
    const response = {
      statusCode: 200,
      statusMessage: "OK",
      ok: true,
      timings,
      body,
    } as Response<typeof body>;
    const requestMock = jest.fn().mockResolvedValue(response);
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({
      type: "infrastructure" as any,
      url: "https://infra.example.com",
      secret: "topsecret",
    });

    const result = await service.requestInfrastructure(monitor);

    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("https://infra.example.com", {
      headers: { Authorization: "Bearer topsecret" },
      responseType: "json",
    });
    expect(result.status).toBe("up");
    expect(result.code).toBe(200);
    expect(result.message).toBe("OK");
    expect(result.responseTime).toBe(456);
    expect(result.payload).toBe(body);
  });

  it("throws when monitor is missing a URL", async () => {
    const requestMock = jest.fn();
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({ type: "infrastructure" as any, url: undefined as any });

    await expect(service.requestInfrastructure(monitor)).rejects.toThrow("No URL provided");
    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("throws when monitor is missing a secret", async () => {
    const requestMock = jest.fn();
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({ type: "infrastructure" as any, secret: undefined as any });

    await expect(service.requestInfrastructure(monitor)).rejects.toThrow(
      "No secret provided for infrastructure monitor"
    );
    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("returns fallback response when infrastructure payload missing", async () => {
    const response = {
      statusCode: 200,
      statusMessage: "OK",
      ok: true,
      timings: { phases: { total: 111 } } as Response["timings"],
      body: undefined,
    } as Response<any>;
    const requestMock = jest.fn().mockResolvedValue(response);
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({
      type: "infrastructure" as any,
      url: "https://infra.example.com",
      secret: "secret",
    });

    const result = await service.requestInfrastructure(monitor);
    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("https://infra.example.com", {
      headers: { Authorization: "Bearer secret" },
      responseType: "json",
    });
    expect(result.status).toBe("down");
    expect(result.code).toBe(5000);
    expect(result.message).toBe("No payload received from infrastructure monitor");
  });

  it("returns fallback response when infrastructure request rejects", async () => {
    const error = new Error("timeout");
    const requestMock = jest.fn().mockRejectedValue(error);
    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({
      type: "infrastructure" as any,
      url: "https://infra.example.com",
      secret: "secret",
    });

    const result = await service.requestInfrastructure(monitor);

    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("https://infra.example.com", {
      headers: { Authorization: "Bearer secret" },
      responseType: "json",
    });
    expect(result.status).toBe("down");
    expect(result.message).toBe("timeout");
    expect(result.code).toBe(5000);
  });
});
