import JobQueue from "@/services/infrastructure/JobQueue.js";

// Mocks
jest.mock("super-simple-scheduler", () => {
  return function Scheduler() {
    return {
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue(true),
      addTemplate: jest.fn(),
      addJob: jest.fn().mockResolvedValue(true),
      pauseJob: jest.fn().mockResolvedValue(true),
      resumeJob: jest.fn().mockResolvedValue(true),
      updateJob: jest.fn().mockResolvedValue(true),
      removeJob: jest.fn(),
      getJobs: jest.fn().mockResolvedValue([]),
      flushJobs: jest.fn().mockResolvedValue(true),
    };
  };
});

jest.mock("@/db/models/index.js", () => ({
  Monitor: {
    find: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(true),
  },
}));
import Scheduler from "super-simple-scheduler";
import { Monitor } from "@/db/models/index.js";

const mockJobGenerator = () => ({
  generateJob: jest.fn(() => ({
    handler: jest.fn(),
  })),
  generateCleanupJob: jest.fn(() => ({ handler: jest.fn() })),
});

describe("JobQueue", () => {
  beforeEach(() => {
    // Reset singleton between tests
    // @ts-ignore
    JobQueue["instance"] = null;
    jest.clearAllMocks();
  });

  it("creates singleton and initializes templates and cleanup job", async () => {
    const jq = await JobQueue.create(mockJobGenerator());
    expect(jq).toBeInstanceOf(JobQueue);
    expect(Scheduler().addTemplate).toBeDefined();
  });

  it("add/pause/resume/update/delete/flush/shutdown return true on scheduler success", async () => {
    const jq = await JobQueue.create(mockJobGenerator());
    const monitor = { _id: "m1", interval: 1000, status: "up", url: "http://x" };
    await expect(jq.addJob(monitor)).resolves.toBe(true);
    await expect(jq.pauseJob(monitor)).resolves.toBe(true);
    await expect(jq.resumeJob(monitor)).resolves.toBe(true);
    await expect(jq.updateJob(monitor)).resolves.toBe(true);
    await expect(jq.deleteJob(monitor)).resolves.toBe(true);
    await expect(jq.flush()).resolves.toBe(true);
    await expect(jq.shutdown()).resolves.toBe(true);
  });

  it("getJobs maps lastRunTook only when run finished and not locked", async () => {
    const fakeJobs = [
      { id: "a", lockedAt: null, lastRunAt: 100, lastFinishedAt: 160 }, // took 60
      { id: "b", lockedAt: 1, lastRunAt: 100, lastFinishedAt: 120 }, // locked => null
      { id: "c", lockedAt: null, lastRunAt: null, lastFinishedAt: 120 }, // missing => null
    ];
    const jq = await JobQueue.create(mockJobGenerator());
    // Patch scheduler's getJobs to return our fake jobs
    // @ts-ignore
    jq["scheduler"].getJobs = jest.fn().mockResolvedValue(fakeJobs);
    const jobs = await jq.getJobs();
    expect(jobs?.find((j) => j.id === "a")?.lastRunTook).toBe(60);
    expect(jobs?.find((j) => j.id === "b")?.lastRunTook).toBeNull();
    expect(jobs?.find((j) => j.id === "c")?.lastRunTook).toBeNull();
  });

  it("getMetrics aggregates counters and flags failing/active jobs", async () => {
    const jobs = [
      { id: "1", data: { url: "u1", type: "http" }, runCount: 2, failCount: 1, lastFailedAt: 200, lastRunAt: 100, lastFailReason: "e1", lockedAt: null },
      { id: "2", data: { url: "u2", type: "ping" }, runCount: 0, failCount: 0, lastFailedAt: null, lastRunAt: null, lastFailReason: null, lockedAt: 1 },
    ];
    const jq = await JobQueue.create(mockJobGenerator());
    // @ts-ignore
    jq["scheduler"].getJobs = jest.fn().mockResolvedValue(jobs);
    const metrics = await jq.getMetrics();
    expect(metrics).toMatchObject({ jobs: 2, totalRuns: 2, totalFailures: 1, activeJobs: 1, failingJobs: 1 });
    expect(metrics?.jobsWithFailures[0]).toMatchObject({ monitorId: "1", failReason: "e1" });
  });

  it("init schedules addJob for existing monitors and skips missing ones", async () => {
    jest.useFakeTimers();
    const originalRandom = Math.random;
    // Force deterministic offsets of 1000ms
    Math.random = jest.fn().mockReturnValue(0);
    const monitors = [
      { _id: "a", interval: 1000, status: "up" },
      { _id: "b", interval: 1000, status: "up" },
    ];
    Monitor.find.mockResolvedValueOnce(monitors);
    // exists: only 'a' exists
    Monitor.exists.mockImplementation(async ({ _id }) => _id === "a");
    const gen = mockJobGenerator();
    const jq = await JobQueue.create(gen);
    const addSpy = jest.spyOn(jq, "addJob").mockResolvedValue(true);
    // Advance timers to trigger setTimeouts (1000ms)
    jest.advanceTimersByTime(1100);
    // Allow async callback to resolve
    // @ts-ignore
    if (jest.runOnlyPendingTimersAsync) {
      // modern timers
      // @ts-ignore
      await jest.runOnlyPendingTimersAsync();
    }
    await Promise.resolve();
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: "a" }));
    // restore
    Math.random = originalRandom;
    jest.useRealTimers();
  });

  it("returns false/null on scheduler errors across methods", async () => {
    const jq = await JobQueue.create(mockJobGenerator());
    // addJob failure
    // @ts-ignore
    jq["scheduler"].addJob = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.addJob({ _id: "m1", interval: 1, status: "up" })).resolves.toBe(false);
    // pause/resume/update failures
    // @ts-ignore
    jq["scheduler"].pauseJob = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.pauseJob({ _id: "m1" })).resolves.toBe(false);
    // @ts-ignore
    jq["scheduler"].resumeJob = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.resumeJob({ _id: "m1" })).resolves.toBe(false);
    // @ts-ignore
    jq["scheduler"].updateJob = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.updateJob({ _id: "m1", interval: 1 })).resolves.toBe(false);
    // delete failure
    // @ts-ignore
    jq["scheduler"].removeJob = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.deleteJob({ _id: "m1" })).resolves.toBe(false);
    // getJobs failure
    // @ts-ignore
    jq["scheduler"].getJobs = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.getJobs()).resolves.toBeNull();
    // getMetrics failure
    // @ts-ignore
    jq["scheduler"].getJobs = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.getMetrics()).resolves.toBeNull();
    // flush/shutdown failure
    // @ts-ignore
    jq["scheduler"].flushJobs = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.flush()).resolves.toBe(false);
    // @ts-ignore
    jq["scheduler"].stop = jest.fn(() => { throw new Error("boom"); });
    await expect(jq.shutdown()).resolves.toBe(false);
  });

  it("init returns false when scheduler throws during setup", async () => {
    const jq = new JobQueue();
    // Force addTemplate to throw
    // @ts-ignore
    jq["scheduler"].addTemplate = jest.fn(() => { throw new Error("setup fail"); });
    // attach generator to avoid undefined access
    // @ts-ignore
    jq["jobGenerator"] = mockJobGenerator();
    await expect(jq.init()).resolves.toBe(false);
  });
});
