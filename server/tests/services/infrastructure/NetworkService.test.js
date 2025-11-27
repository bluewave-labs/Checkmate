import NetworkService from "@/services/infrastructure/NetworkService.js";
import { Types } from "mongoose";
import ping from "ping";
jest.mock("@/config/index.js", () => ({
    config: { PAGESPEED_API_KEY: "test-key" },
}));
const configModule = jest.requireMock("@/config/index.js");
jest.mock("got", () => {
    const extend = jest.fn();
    class MockHTTPError extends Error {
        response;
        timings;
        constructor(message, options = {}) {
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
    default: class CacheableLookup {
    },
}));
jest.mock("ping", () => ({
    promise: { probe: jest.fn() },
}));
// Mock net for requestPort tests
jest.mock("net", () => {
    const listeners = new Map();
    const socket = {
        setTimeout: jest.fn(),
        on: jest.fn((event, cb) => {
            listeners.set(event, cb);
            return socket;
        }),
        destroy: jest.fn(),
        __emit: (event, arg) => {
            const cb = listeners.get(event);
            if (cb) cb(arg);
        },
    };
    return {
        __esModule: true,
        default: {
            createConnection: jest.fn(() => socket),
            __socket: socket,
        },
    };
});
const getNetModule = () => jest.requireMock("net").default;
const getGotModule = () => jest.requireMock("got");
const buildMonitor = (overrides = {}) => ({
    _id: new Types.ObjectId(),
    teamId: new Types.ObjectId(),
    type: "http",
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
});
const createService = (clientMock) => {
    const gotModule = getGotModule();
    const extendMock = gotModule.default.extend;
    const requestMock = clientMock ?? jest.fn();
    // Return a function that produces a promise-like with an `.on` method
    extendMock.mockImplementation(() => {
        return (...args) => {
            const p = requestMock(...args);
            // ensure we always have a thenable
            const promise = p && typeof p.then === "function" ? p : Promise.resolve(p);
            // preserve custom `.on` from the mock if provided; otherwise add a no-op
            if (typeof (promise).on !== "function") {
                (promise).on = jest.fn(() => promise);
            }
            return promise;
        };
    });
    const service = new NetworkService(gotModule.default);
    return { service, requestMock, extendMock, gotModule };
};
const invokeBuildStatusResponse = (service, monitor, response, error) => service.buildStatusResponse(monitor, response, error);
beforeEach(() => {
    const gotModule = getGotModule();
    gotModule.default.extend.mockReset();
    ping.promise.probe.mockReset();
    configModule.config.PAGESPEED_API_KEY = "test-key";
});
beforeEach(() => {
    const gotModule = getGotModule();
    gotModule.default.extend.mockReset();
    ping.promise.probe.mockReset();
    configModule.config.PAGESPEED_API_KEY = "test-key";
});
describe("NetworkService.buildStatusResponse", () => {
    it("maps successful response details", () => {
        const { service } = createService();
        const timings = {
            phases: { total: 321 },
        };
        const response = {
            statusCode: 201,
            statusMessage: "Accepted",
            ok: true,
            timings,
        };
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
    it("returns default error payload for generic failures without message", () => {
        const { service } = createService();
        const monitor = buildMonitor();
        const error = new Error("timeout");
        error.message = "";
        const result = invokeBuildStatusResponse(service, monitor, null, error);
        expect(result.monitorId).toBe(monitor._id.toString());
        expect(result.status).toBe("down");
        expect(result.code).toBe(5000);
        expect(result.message).toBe("Network error");
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
    it("handles HTTPError without timings/statusCode", () => {
        const { service, gotModule } = createService();
        const { HTTPError } = gotModule;
        const monitor = buildMonitor();
        const httpError = new HTTPError("Boom", {});
        const result = invokeBuildStatusResponse(service, monitor, null, httpError);
        expect(result.status).toBe("down");
        expect(result.code).toBe(5000);
        expect(result.message).toBe("Boom");
        expect(result.responseTime).toBe(0);
        // When no timings exist on HTTPError, we do not attach timings.
        expect(result.timings).toBeUndefined();
    });
    it("defaults timings when missing on successful response", () => {
        const { service } = createService();
        const monitor = buildMonitor();
        const response = { statusCode: 200, ok: true };
        const result = invokeBuildStatusResponse(service, monitor, response, null);
        expect(result.status).toBe("up");
        expect(result.timings).toEqual({ phases: {} });
        expect(result.responseTime).toBe(0);
    });
});
describe("NetworkService.requestHttp", () => {
    it("requests monitor URL and maps successful response", async () => {
        const timings = { phases: { total: 123 } };
        const response = {
            statusCode: 204,
            statusMessage: "No Content",
            ok: true,
            timings,
        };
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
        const monitor = buildMonitor({ url: undefined });
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

  it("captures certificate expiry from reused TLS socket (immediate capture)", async () => {
    const timings = { phases: { total: 50 } };
    const response = { statusCode: 200, statusMessage: "OK", ok: true, timings };
    const validTo = "2030-01-01T00:00:00Z";

    const fakeSocket = {
      getPeerCertificate: jest.fn(() => ({ valid_to: validTo })),
      once: jest.fn((event, cb) => {
        if (event === "secureConnect") {
          // No-op to simulate reused socket (secureConnect not fired)
        }
      }),
    };

    const fakeNodeReq = {
      on: jest.fn((event, cb) => {
        if (event === "socket") cb(fakeSocket);
        return fakeNodeReq;
      }),
    };

    const requestMock = jest.fn((..._args) => {
      const p = Promise.resolve(response);
      p.on = jest.fn((event, cb) => {
        if (event === "request") cb(fakeNodeReq);
        return p;
      });
      return p;
    });

    const { service, extendMock } = createService(requestMock);
    const monitor = buildMonitor({ url: "https://api.example.com" });
    const result = await service.requestHttp(monitor);
    expect(extendMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("https://api.example.com");
    expect(result.status).toBe("up");
    expect(result.certificateExpiry?.toISOString()).toBe(new Date(validTo).toISOString());
  });

  it("captures certificate expiry after secureConnect (fresh TLS handshake)", async () => {
    const timings = { phases: { total: 50 } };
    const response = { statusCode: 200, statusMessage: "OK", ok: true, timings };
    const validTo = "2031-02-03T04:05:06Z";

    let secureCb;
    // First call returns empty object (before handshake); after secureConnect returns populated cert
    const getPeerCertificate = jest
      .fn()
      .mockImplementationOnce(() => ({}))
      .mockImplementation(() => ({ valid_to: validTo }));

    const fakeSocket = {
      getPeerCertificate,
      once: jest.fn((event, cb) => {
        if (event === "secureConnect") {
          secureCb = cb;
          // simulate handshake completion
          cb();
        }
      }),
    };

    const fakeNodeReq = {
      on: jest.fn((event, cb) => {
        if (event === "socket") cb(fakeSocket);
        return fakeNodeReq;
      }),
    };

    const requestMock = jest.fn((..._args) => {
      const p = Promise.resolve(response);
      p.on = jest.fn((event, cb) => {
        if (event === "request") cb(fakeNodeReq);
        return p;
      });
      return p;
    });

    const { service } = createService(requestMock);
    const monitor = buildMonitor({ url: "https://secure.example.com" });
    const result = await service.requestHttp(monitor);
    expect(result.status).toBe("up");
    expect(result.certificateExpiry?.toISOString()).toBe(new Date(validTo).toISOString());
    expect(getPeerCertificate).toHaveBeenCalled();
  });

  it("skips TLS options for http and leaves certificateExpiry null", async () => {
    const timings = { phases: { total: 33 } };
    const response = { statusCode: 200, statusMessage: "OK", ok: true, timings };

    const fakeSocket = {
      getPeerCertificate: jest.fn(() => undefined),
      once: jest.fn(() => {}),
    };
    const fakeNodeReq = {
      on: jest.fn((event, cb) => {
        if (event === "socket") cb(fakeSocket);
        return fakeNodeReq;
      }),
    };
    const requestMock = jest.fn((..._args) => {
      const p = Promise.resolve(response);
      p.on = jest.fn((event, cb) => {
        if (event === "request") cb(fakeNodeReq);
        return p;
      });
      return p;
    });
    const { service } = createService(requestMock);
    const monitor = buildMonitor({ url: "http://api.example.com" });
    const result = await service.requestHttp(monitor);
    expect(requestMock).toHaveBeenCalledWith("http://api.example.com");
    expect(result.status).toBe("up");
    expect(result.certificateExpiry).toBeNull();
  });

  it("passes https rejectUnauthorized=false per call when set on monitor", async () => {
    const timings = { phases: { total: 40 } };
    const response = { statusCode: 200, statusMessage: "OK", ok: true, timings };
    const validTo = "2032-01-01T00:00:00Z";

    const fakeSocket = {
      getPeerCertificate: jest.fn(() => ({ valid_to: validTo })),
      once: jest.fn(() => {}),
    };
    const fakeNodeReq = {
      on: jest.fn((event, cb) => {
        if (event === "socket") cb(fakeSocket);
        return fakeNodeReq;
      }),
    };
    const requestMock = jest.fn((..._args) => {
      const p = Promise.resolve(response);
      p.on = jest.fn((event, cb) => {
        if (event === "request") cb(fakeNodeReq);
        return p;
      });
      return p;
    });

    const { service } = createService(requestMock);
    const monitor = buildMonitor({ url: "https://secure.example.com", rejectUnauthorized: false });
    const result = await service.requestHttp(monitor);
    expect(requestMock).toHaveBeenCalledWith("https://secure.example.com", {
      https: { rejectUnauthorized: false },
    });
    expect(result.status).toBe("up");
    expect(result.certificateExpiry?.toISOString()).toBe(new Date(validTo).toISOString());
  });
});
// requestInfrastructure block covers success path and every guard/exception branch so all lines execute.
describe("NetworkService.requestInfrastructure", () => {
    it("requests infrastructure endpoint with auth header and attaches payload", async () => {
        const body = { data: { cpu: 10 }, capture: { version: "1" } };
        const timings = { phases: { total: 456 } };
        const response = {
            statusCode: 200,
            statusMessage: "OK",
            ok: true,
            timings,
            body,
        };
        const requestMock = jest.fn().mockResolvedValue(response);
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({
            type: "infrastructure",
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
        const monitor = buildMonitor({
            type: "infrastructure",
            url: undefined,
        });
        await expect(service.requestInfrastructure(monitor)).rejects.toThrow("No URL provided");
        expect(extendMock).toHaveBeenCalledTimes(1);
        expect(requestMock).not.toHaveBeenCalled();
    });
    it("throws when monitor is missing a secret", async () => {
        const requestMock = jest.fn();
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({
            type: "infrastructure",
            secret: undefined,
        });
        await expect(service.requestInfrastructure(monitor)).rejects.toThrow("No secret provided for infrastructure monitor");
        expect(extendMock).toHaveBeenCalledTimes(1);
        expect(requestMock).not.toHaveBeenCalled();
    });
    it("returns fallback response when infrastructure payload missing", async () => {
        const response = {
            statusCode: 200,
            statusMessage: "OK",
            ok: true,
            timings: { phases: { total: 111 } },
            body: undefined,
        };
        const requestMock = jest.fn().mockResolvedValue(response);
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({
            type: "infrastructure",
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
            type: "infrastructure",
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
describe("NetworkService.requestPagespeed", () => {
    const pagespeedUrl = "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://site.example.com&category=seo&category=accessibility&category=best-practices&category=performance&key=test-key";
    it("requests pagespeed URL and attaches payload", async () => {
        const primaryResponse = {
            statusCode: 200,
            statusMessage: "OK",
            ok: true,
            timings: { phases: { total: 222 } },
        };
        const payload = { lighthouseResult: { score: 0.9 } };
        const secondaryResponse = { body: payload };
        const requestMock = jest
            .fn()
            .mockResolvedValueOnce(primaryResponse)
            .mockResolvedValueOnce(secondaryResponse);
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({
            type: "pagespeed",
            url: "https://site.example.com",
        });
        const result = await service.requestPagespeed(monitor);
        expect(extendMock).toHaveBeenCalledTimes(1);
        expect(requestMock).toHaveBeenNthCalledWith(1, "https://site.example.com");
        expect(requestMock).toHaveBeenNthCalledWith(2, pagespeedUrl, {
            responseType: "json",
        });
        expect(result.status).toBe("up");
        expect(result.payload).toBe(payload);
    });
    it("throws when pagespeed API key missing", async () => {
        configModule.config.PAGESPEED_API_KEY = "";
        const requestMock = jest.fn();
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({ type: "pagespeed" });
        await expect(service.requestPagespeed(monitor)).rejects.toThrow("No API key provided for pagespeed monitor");
        expect(extendMock).toHaveBeenCalledTimes(1);
        expect(requestMock).not.toHaveBeenCalled();
    });
    it("throws when monitor lacks URL", async () => {
        const requestMock = jest.fn();
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({
            type: "pagespeed",
            url: undefined,
        });
        await expect(service.requestPagespeed(monitor)).rejects.toThrow("No URL provided");
        expect(extendMock).toHaveBeenCalledTimes(1);
        expect(requestMock).not.toHaveBeenCalled();
    });
    it("returns fallback response when initial request fails", async () => {
        const error = new Error("timeout");
        const payload = { lighthouseResult: { score: 0.8 } };
        const requestMock = jest
            .fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce({ body: payload });
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({
            type: "pagespeed",
            url: "https://s",
        });
        const result = await service.requestPagespeed(monitor);
        expect(extendMock).toHaveBeenCalledTimes(1);
        expect(requestMock).toHaveBeenNthCalledWith(1, "https://s");
        expect(result.status).toBe("down");
        expect(result.message).toBe("timeout");
        expect(result.payload).toBe(payload);
    });
    it("throws ApiError when pagespeed payload missing", async () => {
        const primaryResponse = {
            statusCode: 200,
            statusMessage: "OK",
            ok: true,
            timings: { phases: { total: 111 } },
        };
        const requestMock = jest
            .fn()
            .mockResolvedValueOnce(primaryResponse)
            .mockResolvedValueOnce({ body: undefined });
        const { service, extendMock } = createService(requestMock);
        const monitor = buildMonitor({
            type: "pagespeed",
            url: "https://site.example.com",
        });
        await expect(service.requestPagespeed(monitor)).rejects.toThrow("No payload received from pagespeed monitor");
        expect(extendMock).toHaveBeenCalledTimes(1);
        expect(requestMock).toHaveBeenNthCalledWith(2, pagespeedUrl, {
            responseType: "json",
        });
    });
    it("returns down status when primary response is not ok but still attaches payload", async () => {
        const primaryResponse = {
            statusCode: 500,
            statusMessage: "Server Error",
            ok: false,
        };
        const payload = { lighthouseResult: { score: 0.7 } };
        const secondaryResponse = { body: payload };
        const requestMock = jest
            .fn()
            .mockResolvedValueOnce(primaryResponse)
            .mockResolvedValueOnce(secondaryResponse);
        const { service } = createService(requestMock);
        const monitor = buildMonitor({ type: "pagespeed", url: "https://x" });
        const result = await service.requestPagespeed(monitor);
        expect(result.status).toBe("down");
        expect(result.code).toBe(500);
        expect(result.payload).toBe(payload);
    });
});
describe("NetworkService.requestPing", () => {
    it("maps successful ping with string time", async () => {
        ping.promise.probe.mockResolvedValue({
            alive: true,
            time: "12.5",
        });
        const { service } = createService();
        const monitor = buildMonitor({ type: "ping", url: "8.8.8.8" });
        const result = await service.requestPing(monitor);
        expect(ping.promise.probe).toHaveBeenCalledWith("8.8.8.8");
        expect(result.status).toBe("up");
        expect(result.responseTime).toBeCloseTo(12.5);
        expect(result.timings?.phases).toEqual({});
    });
    it("maps failure ping with invalid time to zero", async () => {
        ping.promise.probe.mockResolvedValue({
            alive: false,
            time: "NaN",
        });
        const { service } = createService();
        const monitor = buildMonitor({ type: "ping", url: "1.1.1.1" });
        const result = await service.requestPing(monitor);
        expect(result.status).toBe("down");
        expect(result.responseTime).toBe(0);
        expect(result.message).toBe("Ping successful");
    });
    it("handles numeric ping times", async () => {
        ping.promise.probe.mockResolvedValue({
            alive: true,
            time: 18,
        });
        const { service } = createService();
        const monitor = buildMonitor({ type: "ping", url: "9.9.9.9" });
        const result = await service.requestPing(monitor);
        expect(result.responseTime).toBe(18);
        expect(result.status).toBe("up");
    });
});

describe("NetworkService.requestPort", () => {
    it("returns default response when port missing", async () => {
        const { service } = createService();
        const monitor = buildMonitor({ type: "port", url: "localhost", port: undefined });
        const result = await service.requestPort(monitor);
        expect(result.status).toBe("down");
        expect(result.message).toBe("Port check failed");
        expect(result.responseTime).toBe(0);
    });
    it("resolves up on connect event", async () => {
        const { service } = createService();
        const netModule = getNetModule();
        const monitor = buildMonitor({ type: "port", url: "localhost", port: 80 });
        const promise = service.requestPort(monitor);
        // Emit connect
        netModule.__socket.__emit("connect");
        const result = await promise;
        expect(result.status).toBe("up");
        expect(result.message).toBe("Port is open");
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
    it("resolves down on error event", async () => {
        const { service } = createService();
        const netModule = getNetModule();
        const monitor = buildMonitor({ type: "port", url: "localhost", port: 81 });
        const promise = service.requestPort(monitor);
        netModule.__socket.__emit("error", new Error("ECONNREFUSED"));
        const result = await promise;
        expect(result.status).toBe("down");
        expect(result.message).toBe("ECONNREFUSED");
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
    it("resolves down on timeout event", async () => {
        const { service } = createService();
        const netModule = getNetModule();
        const monitor = buildMonitor({ type: "port", url: "localhost", port: 82 });
        const promise = service.requestPort(monitor);
        netModule.__socket.__emit("timeout");
        const result = await promise;
        expect(result.status).toBe("down");
        expect(result.message).toBe("Port check timed out");
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
});
describe("NetworkService.requestStatus", () => {
    it("routes http monitors through requestHttp", async () => {
        const { service } = createService();
        const httpSpy = jest.spyOn(service, "requestHttp").mockResolvedValueOnce({
            monitorId: "1",
            teamId: "t",
            type: "http",
            status: "up",
            message: "OK",
            responseTime: 1,
            timings: { phases: {} },
        });
        const monitor = buildMonitor({ type: "http" });
        const result = await service.requestStatus(monitor);
        expect(httpSpy).toHaveBeenCalledTimes(1);
        expect(result.status).toBe("up");
    });
    it("routes https monitors through requestHttp", async () => {
        const { service } = createService();
        const httpSpy = jest.spyOn(service, "requestHttp").mockResolvedValueOnce({
            monitorId: "2",
            teamId: "t",
            type: "https",
            status: "up",
            message: "OK",
            responseTime: 2,
            timings: { phases: {} },
        });
        const monitor = buildMonitor({ type: "https" });
        await service.requestStatus(monitor);
        expect(httpSpy).toHaveBeenCalledTimes(1);
    });
    it("routes infrastructure monitors through requestInfrastructure", async () => {
        const { service } = createService();
        const infraSpy = jest
            .spyOn(service, "requestInfrastructure")
            .mockResolvedValueOnce({
            monitorId: "3",
            teamId: "t",
            type: "infrastructure",
            status: "up",
            message: "OK",
            responseTime: 3,
            timings: { phases: {} },
        });
        const monitor = buildMonitor({ type: "infrastructure" });
        await service.requestStatus(monitor);
        expect(infraSpy).toHaveBeenCalledTimes(1);
    });
    it("routes pagespeed monitors through requestPagespeed", async () => {
        const { service } = createService();
        const pageSpy = jest
            .spyOn(service, "requestPagespeed")
            .mockResolvedValueOnce({
            monitorId: "4",
            teamId: "t",
            type: "pagespeed",
            status: "up",
            message: "OK",
            responseTime: 4,
            timings: { phases: {} },
        });
        const monitor = buildMonitor({ type: "pagespeed" });
        await service.requestStatus(monitor);
        expect(pageSpy).toHaveBeenCalledTimes(1);
    });
    it("routes ping monitors through requestPing", async () => {
        const { service } = createService();
        const pingSpy = jest.spyOn(service, "requestPing").mockResolvedValueOnce({
            monitorId: "5",
            teamId: "t",
            type: "ping",
            status: "down",
            message: "Timeout",
            responseTime: 0,
            timings: { phases: {} },
        });
        const monitor = buildMonitor({ type: "ping" });
        await service.requestStatus(monitor);
        expect(pingSpy).toHaveBeenCalledTimes(1);
    });
  it("throws for unsupported monitor types", async () => {
    const { service } = createService();
    const monitor = buildMonitor({ type: "websocket" });
    await expect(service.requestStatus(monitor)).rejects.toThrow("Not implemented");
  });

  it("routes port monitors through requestPort", async () => {
    const { service } = createService();
    const portSpy = jest.spyOn(service, "requestPort").mockResolvedValueOnce({
      monitorId: "6",
      teamId: "t",
      type: "port",
      status: "up",
      message: "Port is open",
      responseTime: 10,
      timings: { phases: {} },
    });
    const monitor = buildMonitor({ type: "port", url: "localhost", port: 80 });
    const result = await service.requestStatus(monitor);
    expect(portSpy).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("up");
  });
});
