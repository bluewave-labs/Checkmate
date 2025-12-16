import JobGenerator from "@/services/infrastructure/JobGenerator.js";

// Minimal monitor/check shapes
const monitor = { _id: "m1", type: "http" };
const infraMonitor = { _id: "m2", type: "infrastructure" };

const buildDeps = () => {
  const networkService = { requestStatus: jest.fn() };
  const checkService = { buildCheck: jest.fn(), cleanupOrphanedChecks: jest.fn() };
  const monitorStatsService = { cleanupOrphanedMonitorStats: jest.fn() };
  const statusService = {
    updateMonitorStatus: jest.fn(),
    updateMonitorStats: jest.fn(),
    evaluateThresholds: jest.fn(),
  };
  const notificationService = { handleNotifications: jest.fn().mockResolvedValue(true) };
  const maintenanceService = { isInMaintenance: jest.fn().mockResolvedValue(false) };
  const incidentService = {
    handleStatusChange: jest.fn(),
    handleThresholdBreach: jest.fn(),
    cleanupOrphanedIncidents: jest.fn(),
  };

  return {
    networkService,
    checkService,
    monitorStatsService,
    statusService,
    notificationService,
    incidentService,
    maintenanceService,
  };
};

describe("JobGenerator", () => {
  it("skips job when in maintenance window", async () => {
    const d = buildDeps();
    d.maintenanceService.isInMaintenance.mockResolvedValue(true);
    const gen = new JobGenerator(
      d.networkService,
      d.checkService,
      d.monitorStatsService,
      d.statusService,
      d.notificationService,
      d.incidentService,
      d.maintenanceService
    );
    const job = gen.generateJob();
    await expect(job(monitor)).resolves.toBeUndefined();
    expect(d.networkService.requestStatus).not.toHaveBeenCalled();
  });

  it("runs full flow for http monitor, triggers notifications only on status change", async () => {
    const d = buildDeps();
    d.networkService.requestStatus.mockResolvedValue({ status: "up" });
    const fakeCheck = { save: jest.fn().mockResolvedValue(true) };
    d.checkService.buildCheck.mockResolvedValue(fakeCheck);
    d.statusService.updateMonitorStatus.mockResolvedValue([{ _id: "m1", type: "http" }, true]);
    d.statusService.updateMonitorStats.mockResolvedValue({});
    d.incidentService.handleStatusChange.mockResolvedValue({ id: "incident1" });

    const gen = new JobGenerator(
      d.networkService,
      d.checkService,
      d.monitorStatsService,
      d.statusService,
      d.notificationService,
      d.incidentService,
      d.maintenanceService
    );
    const job = gen.generateJob();
    await job(monitor);
    expect(d.networkService.requestStatus).toHaveBeenCalledWith(monitor);
    expect(d.checkService.buildCheck).toHaveBeenCalled();
    expect(fakeCheck.save).toHaveBeenCalled();
    expect(d.statusService.updateMonitorStatus).toHaveBeenCalled();
    expect(d.incidentService.handleStatusChange).toHaveBeenCalled();
    expect(d.notificationService.handleNotifications).toHaveBeenCalled();
    expect(d.statusService.updateMonitorStats).toHaveBeenCalled();
    // Not an infra monitor, so evaluateThresholds not called
    expect(d.statusService.evaluateThresholds).not.toHaveBeenCalled();
  });

  it("evaluates thresholds and may notify for infrastructure monitors", async () => {
    const d = buildDeps();
    d.networkService.requestStatus.mockResolvedValue({ status: "up" });
    const fakeCheck = { save: jest.fn().mockResolvedValue(true) };
    d.checkService.buildCheck.mockResolvedValue(fakeCheck);
    d.statusService.updateMonitorStatus.mockResolvedValue([{ _id: "m2", type: "infrastructure" }, false]);
    d.statusService.updateMonitorStats.mockResolvedValue({});
    d.statusService.evaluateThresholds.mockResolvedValue({ hasBreach: true, notes: [], metrics: {} });
    d.incidentService.handleThresholdBreach.mockResolvedValue({ id: "incident2" });

    const gen = new JobGenerator(
      d.networkService,
      d.checkService,
      d.monitorStatsService,
      d.statusService,
      d.notificationService,
      d.incidentService,
      d.maintenanceService
    );
    const job = gen.generateJob();
    await job(infraMonitor);
    expect(d.statusService.evaluateThresholds).toHaveBeenCalled();
    expect(d.incidentService.handleThresholdBreach).toHaveBeenCalled();
    expect(d.notificationService.handleNotifications).toHaveBeenCalled();
  });

  it("propagates errors thrown during job execution", async () => {
    const d = buildDeps();
    d.networkService.requestStatus.mockRejectedValue(new Error("net"));
    const gen = new JobGenerator(
      d.networkService,
      d.checkService,
      d.monitorStatsService,
      d.statusService,
      d.notificationService,
      d.incidentService,
      d.maintenanceService
    );
    const job = gen.generateJob();
    await expect(job(monitor)).rejects.toThrow("net");
  });

  it("cleanup job runs all cleanup steps and propagates errors", async () => {
    const d = buildDeps();
    const gen = new JobGenerator(
      d.networkService,
      d.checkService,
      d.monitorStatsService,
      d.statusService,
      d.notificationService,
      d.incidentService,
      d.maintenanceService
    );
    const cleanup = gen.generateCleanupJob();
    await cleanup();
    expect(d.checkService.cleanupOrphanedChecks).toHaveBeenCalled();
    expect(d.monitorStatsService.cleanupOrphanedMonitorStats).toHaveBeenCalled();
    expect(d.incidentService.cleanupOrphanedIncidents).toHaveBeenCalled();

    // error propagation
    d.checkService.cleanupOrphanedChecks.mockRejectedValueOnce(new Error("oops"));
    await expect(cleanup()).rejects.toThrow("oops");
  });
});

