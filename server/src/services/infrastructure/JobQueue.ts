import { IJob } from "super-simple-scheduler/dist/job/job.js";
import { Monitor, IMonitor } from "@/db/models/index.js";
import Scheduler from "super-simple-scheduler";
import { IJobGenerator } from "./JobGenerator.js";
import { getChildLogger } from "@/logger/Logger.js";

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
  addJob: (monitor: IMonitor) => Promise<boolean>;
  pauseJob: (monitor: IMonitor) => Promise<boolean>;
  resumeJob: (monitor: IMonitor) => Promise<boolean>;
  updateJob: (monitor: IMonitor) => Promise<boolean>;
  deleteJob: (monitor: IMonitor) => Promise<boolean>;
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
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.scheduler = new Scheduler({
      logLevel: "debug",
    });
  }

  static async create(jobGenerator: IJobGenerator) {
    if (!JobQueue.instance) {
      const instance = new JobQueue();
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

      const monitors = await Monitor.find();
      for (const monitor of monitors) {
        const randomOffset = 1000 + Math.random() * 1000;

        setTimeout(async () => {
          const exists = await Monitor.exists({ _id: monitor._id });
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

  addJob = async (monitor: IMonitor) => {
    try {
      return await this.scheduler?.addJob({
        id: monitor._id.toString(),
        template: "monitor-job",
        repeat: monitor.interval,
        active: monitor.isActive,
        data: monitor,
      });
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  pauseJob = async (monitor: IMonitor) => {
    try {
      return await this.scheduler?.pauseJob(monitor._id.toString());
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  resumeJob = async (monitor: IMonitor) => {
    try {
      return await this.scheduler.resumeJob(monitor._id.toString());
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  updateJob = async (monitor: IMonitor) => {
    try {
      return await this.scheduler.updateJob(monitor._id.toString(), {
        repeat: monitor.interval,
        data: monitor,
      });
    } catch (error) {
      logger.error(error);
      return false;
    }
  };

  deleteJob = async (monitor: IMonitor) => {
    try {
      this.scheduler?.removeJob(monitor._id.toString());
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
