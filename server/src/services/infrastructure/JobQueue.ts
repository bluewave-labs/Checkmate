import { IJob } from "super-simple-scheduler/dist/job/job.js";
import { Monitor, IMonitor } from "@/db/models/index.js";
import type { Monitor as MonitorEntity } from "@/types/domain/index.js";
import Scheduler from "super-simple-scheduler";
import { IJobGenerator } from "./JobGenerator.js";
import { getChildLogger } from "@/logger/Logger.js";
import { IMonitorRepository } from "@/repositories/index.js";

const SERVICE_NAME = "JobQueue";
const logger = getChildLogger(SERVICE_NAME);
export interface IJobMetrics {
  jobs: number;
  activeJobs: number;
  failingJobs: number;
  jobsWithFailures: Array<{
    monitorId: string | number;
    monitorUrl: string | null;
    monitorType: string | null;
    failedAt: number | null;
    failCount: number | null;
    failReason: string | null;
  }>;
  totalRuns: number;
  totalFailures: number;
}

export interface IJobData extends IJob {
  lastRunTook: number | null;
}

export interface IJobQueue {
  init: () => Promise<boolean>;
  addJob: (monitor: MonitorEntity) => Promise<boolean>;
  pauseJob: (monitor: MonitorEntity) => Promise<boolean>;
  resumeJob: (monitor: MonitorEntity) => Promise<boolean>;
  updateJob: (monitor: MonitorEntity) => Promise<boolean>;
  deleteJob: (monitor: MonitorEntity) => Promise<boolean>;
  getMetrics: () => Promise<IJobMetrics | null>;
  getJobs: () => Promise<IJobData[] | null>;
  flush: () => Promise<boolean>;
  shutdown: () => Promise<boolean>;
}

export default class JobQueue implements IJobQueue {
  public SERVICE_NAME: string;
  private scheduler: Scheduler;
  private static instance: JobQueue | null = null;
  private jobGenerator: any;
  private monitorRepository: IMonitorRepository;
  constructor(monitorRepository: IMonitorRepository) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.scheduler = new Scheduler({
      logLevel: "debug",
    });
    this.monitorRepository = monitorRepository;
  }

  static async create(
    jobGenerator: IJobGenerator,
    monitorRepository: IMonitorRepository
  ) {
    if (!JobQueue.instance) {
      const instance = new JobQueue(monitorRepository);
      instance.jobGenerator = jobGenerator;
      await instance.init();
      JobQueue.instance = instance;
    }
    return JobQueue.instance;
  }

  static getInstance(): JobQueue | null {
    return JobQueue.instance;
  }

  init = async () => {
    try {
      this.scheduler.start();
      // Add template and jobs
      this.scheduler.addTemplate(
        "monitor-job",
        this.jobGenerator.generateJob()
      );

      // Add a cleanup job
      this.scheduler.addTemplate(
        "cleanup-job",
        this.jobGenerator.generateCleanupJob()
      );
      await this.scheduler.addJob({
        id: "cleanup-orphaned-checks",
        template: "cleanup-job",
        repeat: 24 * 60 * 60 * 1000, // 24 hours
        active: true,
      });

      // Stats aggregation job (frequency depends on config)
      this.scheduler.addTemplate(
        "stats-aggregation-job",
        this.jobGenerator.generateStatsAggregationJob()
      );
      await this.scheduler.addJob({
        id: "stats-aggregation",
        template: "stats-aggregation-job",
        repeat: 60 * 60 * 1000, // hourly
        active: true,
      });

      // Trigger an immediate run to populate stats on startup
      try {
        const runNow = this.jobGenerator.generateStatsAggregationJob();
        await runNow();
      } catch (e) {
        logger.warn("Initial stats aggregation run failed", e as any);
      }

      const monitors = await this.monitorRepository.findAll();
      for (const monitor of monitors) {
        const randomOffset = 1000 + Math.random() * 1000;

        setTimeout(async () => {
          const exists = await Monitor.exists({ _id: monitor.id });
          if (exists) {
            this.addJob(monitor);
          }
        }, randomOffset);
      }

      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  addJob = async (monitor: MonitorEntity) => {
    try {
      return await this.scheduler?.addJob({
        id: monitor.id,
        template: "monitor-job",
        repeat: monitor.interval,
        active: monitor.status !== "paused",
        data: monitor,
      });
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  pauseJob = async (monitor: MonitorEntity) => {
    try {
      return await this.scheduler?.pauseJob(monitor.id);
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  resumeJob = async (monitor: MonitorEntity) => {
    try {
      return await this.scheduler.resumeJob(monitor.id);
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  updateJob = async (monitor: MonitorEntity) => {
    try {
      return await this.scheduler.updateJob(monitor.id, {
        repeat: monitor.interval,
        data: monitor,
      });
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  deleteJob = async (monitor: MonitorEntity) => {
    try {
      this.scheduler?.removeJob(monitor.id);
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  getMetrics = async (): Promise<IJobMetrics | null> => {
    try {
      const jobs = await this.scheduler.getJobs();
      const metrics: IJobMetrics = jobs.reduce<IJobMetrics>(
        (acc, job) => {
          if (!job.data) return acc;

          acc.totalRuns += job.runCount || 0;
          acc.totalFailures += job.failCount || 0;
          acc.jobs++;

          // Check if job is currently failing (has recent failures)
          const hasFailures = job.failCount && job.failCount > 0;
          const isCurrentlyFailing =
            hasFailures &&
            job.lastFailedAt &&
            (!job.lastRunAt || job.lastFailedAt > job.lastRunAt);

          if (isCurrentlyFailing) {
            acc.failingJobs++;
          }

          if (job.lockedAt) {
            acc.activeJobs++;
          }

          if (hasFailures) {
            acc.jobsWithFailures.push({
              monitorId: job.id,
              monitorUrl: job.data?.url || null,
              monitorType: job.data?.type || null,
              failedAt: job.lastFailedAt || null,
              failCount: job.failCount || null,
              failReason: job.lastFailReason || null,
            });
          }
          return acc;
        },
        {
          jobs: 0,
          activeJobs: 0,
          failingJobs: 0,
          jobsWithFailures: [],
          totalRuns: 0,
          totalFailures: 0,
        }
      );
      return metrics;
    } catch (error) {
      logger.error(error);
      return null;
    }
  };

  getJobs = async (): Promise<IJobData[] | null> => {
    try {
      const jobs = await this.scheduler.getJobs();
      return jobs.map((job) => {
        return {
          ...job,
          lastRunTook:
            job.lockedAt || !job.lastFinishedAt || !job.lastRunAt
              ? null
              : job.lastFinishedAt - job.lastRunAt,
        };
      });
    } catch (error) {
      logger.error(error);
      return null;
    }
  };

  flush = async () => {
    try {
      return await this.scheduler.flushJobs();
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  shutdown = async () => {
    try {
      return await this.scheduler.stop();
    } catch (error) {
      logger.error(error);
      return false;
    }
  };
}
