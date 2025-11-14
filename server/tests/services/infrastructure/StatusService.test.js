import StatusService from "@/services/infrastructure/StatusService.js";
import { MonitorStats } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import { Types } from "mongoose";
const buildStats = (overrides = {}) => {
    const saveMock = overrides.save ||
        jest.fn().mockImplementation(async function () {
            return this;
        });
    return {
        monitorId: {},
        avgResponseTime: 0,
        maxResponseTime: 0,
        totalChecks: 1,
        totalUpChecks: 0,
        totalDownChecks: 0,
        uptimePercentage: 0,
        lastCheckTimestamp: 0,
        lastResponseTime: 0,
        timeOfLastFailure: 0,
        currentStreak: 0,
        currentStreakStatus: "up",
        currentStreakStartedAt: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: saveMock,
        ...overrides,
    };
};
const buildStatusResponse = (overrides = {}) => ({
    monitorId: "monitor-id",
    teamId: "team-id",
    type: "http",
    status: "up",
    message: "OK",
    responseTime: 0,
    ...overrides,
});
const buildMonitor = (overrides) => {
    const monitor = {
        _id: new Types.ObjectId(),
        teamId: "team-id",
        status: "up",
        latestChecks: [],
        n: 1,
        save: jest.fn(),
        ...overrides,
    };
    if (!monitor.latestChecks) {
        monitor.latestChecks = [];
    }
    monitor.save.mockImplementation(async () => monitor);
    return {
        monitor: monitor,
        saveMock: monitor.save,
    };
};
describe("StatusService.calculateAvgResponseTime", () => {
    const service = new StatusService();
    it("returns latest response time when average is unset", () => {
        const stats = buildStats({ avgResponseTime: 0, totalChecks: 1 });
        const statusResponse = buildStatusResponse({ responseTime: 250 });
        const result = service.calculateAvgResponseTime(stats, statusResponse);
        expect(result).toBe(250);
    });
    it("computes rolling average when checks exist", () => {
        const stats = buildStats({ avgResponseTime: 120, totalChecks: 5 });
        const statusResponse = buildStatusResponse({ responseTime: 300 });
        const result = service.calculateAvgResponseTime(stats, statusResponse);
        expect(result).toBeCloseTo(156);
    });
});
describe("StatusService.updateMonitorStatus", () => {
    const service = new StatusService();
    it("initializing monitor adopts first status", async () => {
        const { monitor, saveMock } = buildMonitor({
            status: "initializing",
            latestChecks: [],
        });
        const statusResponse = buildStatusResponse({ status: "up", responseTime: 120 });
        const [savedMonitor, statusChanged] = await service.updateMonitorStatus(monitor, statusResponse);
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(monitor.status).toBe("up");
        expect(monitor.latestChecks).toHaveLength(1);
        expect(monitor.latestChecks?.[0]?.status).toBe("up");
        expect(monitor.lastCheckedAt).toBeInstanceOf(Date);
        expect(savedMonitor).toBe(monitor);
        expect(statusChanged).toBe(false);
    });
    it("returns early when not enough checks accumulated", async () => {
        const { monitor, saveMock } = buildMonitor({
            status: "up",
            n: 3,
            latestChecks: [],
        });
        const statusResponse = buildStatusResponse({ status: "down", responseTime: 90 });
        const [, statusChanged] = await service.updateMonitorStatus(monitor, statusResponse);
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(monitor.status).toBe("up");
        expect(monitor.latestChecks).toHaveLength(1);
        expect(statusChanged).toBe(false);
    });
    it("updates status when last n checks differ", async () => {
        const { monitor, saveMock } = buildMonitor({
            status: "up",
            n: 2,
            latestChecks: [
                {
                    status: "down",
                    responseTime: 80,
                    checkedAt: new Date("2024-01-01"),
                },
            ],
        });
        const statusResponse = buildStatusResponse({ status: "down", responseTime: 70 });
        const [, statusChanged] = await service.updateMonitorStatus(monitor, statusResponse);
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(monitor.status).toBe("down");
        expect(statusChanged).toBe(true);
        expect(monitor.latestChecks.slice(-2).every((c) => c.status === "down")).toBe(true);
    });
    it("keeps only latest 25 checks", async () => {
        const existingChecks = Array.from({ length: 25 }, (_, index) => ({
            status: "up",
            responseTime: index,
            checkedAt: new Date(`2024-01-${index + 1}`),
        }));
        const { monitor, saveMock } = buildMonitor({
            status: "up",
            n: 1,
            latestChecks: [...existingChecks],
        });
        const statusResponse = buildStatusResponse({ status: "up", responseTime: 200 });
        await service.updateMonitorStatus(monitor, statusResponse);
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(monitor.latestChecks).toHaveLength(25);
        expect(monitor.latestChecks?.[0]?.responseTime).toBe(1);
        expect(monitor.latestChecks?.some((check) => check.responseTime === 0)).toBe(false);
        const lastCheck = monitor.latestChecks?.[monitor.latestChecks.length - 1] ?? null;
        expect(lastCheck?.responseTime).toBe(200);
    });
    it("initializes latestChecks when missing", async () => {
        const { monitor, saveMock } = buildMonitor({});
        delete monitor.latestChecks;
        const statusResponse = buildStatusResponse({ status: "up", responseTime: 75 });
        const [, statusChanged] = await service.updateMonitorStatus(monitor, statusResponse);
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(Array.isArray(monitor.latestChecks)).toBe(true);
        expect(monitor.latestChecks).toHaveLength(1);
        expect(statusChanged).toBe(false);
    });
});
describe("StatusService.updateMonitorStats", () => {
    const service = new StatusService();
    let findOneSpy;
    beforeEach(() => {
        findOneSpy = jest.spyOn(MonitorStats, "findOne");
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });
    it("throws ApiError when monitor stats are missing", async () => {
        findOneSpy.mockResolvedValue(null);
        const { monitor } = buildMonitor({});
        const statusResponse = buildStatusResponse({ status: "up" });
        await expect(service.updateMonitorStats(monitor, statusResponse, false)).rejects.toBeInstanceOf(ApiError);
        await expect(service.updateMonitorStats(monitor, statusResponse, false)).rejects.toMatchObject({ message: "MonitorStats not found", status: 500 });
        expect(findOneSpy).toHaveBeenCalledWith({ monitorId: monitor._id });
    });
    it("increments counters and preserves streak when status unchanged", async () => {
        const now = new Date("2024-02-01T12:00:00Z");
        jest.setSystemTime(now);
        const stats = buildStats({
            totalChecks: 4,
            totalUpChecks: 3,
            totalDownChecks: 1,
            avgResponseTime: 100,
            maxResponseTime: 250,
            lastResponseTime: 90,
            currentStreak: 2,
            currentStreakStatus: "up",
            currentStreakStartedAt: 111,
            lastCheckTimestamp: 1,
            timeOfLastFailure: 555,
        });
        const saveMock = stats.save;
        findOneSpy.mockResolvedValue(stats);
        const { monitor } = buildMonitor({});
        const statusResponse = buildStatusResponse({ status: "up", responseTime: 150 });
        const result = await service.updateMonitorStats(monitor, statusResponse, false);
        expect(findOneSpy).toHaveBeenCalledWith({ monitorId: monitor._id });
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(result).toBe(stats);
        expect(stats.totalChecks).toBe(5);
        expect(stats.totalUpChecks).toBe(4);
        expect(stats.totalDownChecks).toBe(1);
        expect(stats.currentStreak).toBe(3);
        expect(stats.currentStreakStatus).toBe("up");
        expect(stats.currentStreakStartedAt).toBe(111);
        expect(stats.lastCheckTimestamp).toBe(now.getTime());
        expect(stats.timeOfLastFailure).toBe(555);
        expect(stats.avgResponseTime).toBeCloseTo(110);
        expect(stats.uptimePercentage).toBeCloseTo(4 / 5);
        expect(stats.lastResponseTime).toBe(150);
        expect(stats.maxResponseTime).toBe(250);
    });
    it("resets streak and records failure on status change to down", async () => {
        const now = new Date("2024-02-01T12:05:00Z");
        jest.setSystemTime(now);
        const stats = buildStats({
            totalChecks: 10,
            totalUpChecks: 7,
            totalDownChecks: 3,
            avgResponseTime: 200,
            maxResponseTime: 300,
            currentStreak: 5,
            currentStreakStatus: "up",
            currentStreakStartedAt: 999,
            timeOfLastFailure: 444,
        });
        const saveMock = stats.save;
        findOneSpy.mockResolvedValue(stats);
        const { monitor } = buildMonitor({});
        const statusResponse = buildStatusResponse({ status: "down", responseTime: 400 });
        const result = await service.updateMonitorStats(monitor, statusResponse, true);
        expect(findOneSpy).toHaveBeenCalledWith({ monitorId: monitor._id });
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(result).toBe(stats);
        expect(stats.totalChecks).toBe(11);
        expect(stats.totalUpChecks).toBe(7);
        expect(stats.totalDownChecks).toBe(4);
        expect(stats.currentStreak).toBe(1);
        expect(stats.currentStreakStatus).toBe("down");
        expect(stats.currentStreakStartedAt).toBe(now.getTime());
        expect(stats.lastCheckTimestamp).toBe(now.getTime());
        expect(stats.timeOfLastFailure).toBe(now.getTime());
        expect(stats.avgResponseTime).toBeCloseTo((200 * 10 + 400) / 11);
        expect(stats.uptimePercentage).toBeCloseTo(7 / 11);
        expect(stats.lastResponseTime).toBe(400);
        expect(stats.maxResponseTime).toBe(400);
    });
});
