const { Queue, Worker, Job } = require("bullmq");
const QUEUE_NAME = "monitors";
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
};
const JOBS_PER_WORKER = 5;
const logger = require("../utils/logger");
const { errorMessages, successMessages } = require("../utils/messages");
const NetworkService = require("./networkService");
const SERVICE_NAME = "JobQueue";

class JobQueue {
  /**
   * Constructs a new JobQueue
   * @constructor
   * @throws {Error}
   */
  constructor(networkService) {
    this.queue = new Queue(QUEUE_NAME, {
      connection,
    });
    this.workers = [];
    this.db = null;
    this.networkService = null;
  }

  /**
   * Static factory method to create a JobQueue
   * @static
   * @async
   * @returns {Promise<JobQueue>} - Returns a new JobQueue
   *
   */
  static async createJobQueue(db, networkService) {
    const queue = new JobQueue();
    try {
      queue.db = db;
      queue.networkService = networkService;
      const monitors = await db.getAllMonitors();
      for (const monitor of monitors) {
        await queue.addJob(monitor.id, monitor);
      }
      const workerStats = await queue.getWorkerStats();
      await queue.scaleWorkers(workerStats);
      return queue;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates a worker for the queue
   * Operations are carried out in the async callback
   * @returns {Worker} The newly created worker
   */
  createWorker() {
    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        try {
          // Get all maintenance windows for this monitor
          const monitorId = job.data._id;
          const maintenanceWindows =
            await this.db.getMaintenanceWindowsByMonitorId(monitorId);

          // Check for active maintenance window:
          const maintenanceWindowActive = maintenanceWindows.reduce(
            (acc, window) => {
              if (window.active) {
                const start = new Date(window.start);
                const end = new Date(window.end);
                if (start < new Date() && end > new Date()) {
                  return true;
                }
              }
              return acc;
            },
            false
          );

          if (!maintenanceWindowActive) {
            const res = await this.networkService.getStatus(job);
          } else {
            logger.info(`Monitor ${monitorId} is in maintenance window`, {
              service: SERVICE_NAME,
              monitorId,
            });
          }
        } catch (error) {
          logger.error(`Error processing job ${job.id}: ${error.message}`, {
            service: SERVICE_NAME,
            jobId: job.id,
            error: error,
          });
        }
      },
      {
        connection,
      }
    );
    return worker;
  }

  /**
   * @typedef {Object} WorkerStats
   * @property {Array<Job>} jobs - Array of jobs in the Queue
   * @property {number} - workerLoad - The number of jobs per worker
   *
   */

  /**
   * Gets stats related to the workers
   * This is used for scaling workers right now
   * In the future we will likely want to scale based on server performance metrics
   * CPU Usage & memory usage, if too high, scale down workers.
   * When to scale up?  If jobs are taking too long to complete?
   * @async
   * @returns {Promise<WorkerStats>} - Returns the worker stats
   */
  async getWorkerStats() {
    try {
      const jobs = await this.queue.getRepeatableJobs();
      const load = jobs.length / this.workers.length;
      return { jobs, load };
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  /**
   * Scale Workers
   * This function scales workers based on the load per worker
   * If the load is higher than the JOBS_PER_WORKER threshold, we add more workers
   * If the load is lower than the JOBS_PER_WORKER threshold, we release workers
   * This approach ignores server performance, which we should add in the future
   *

   * @async
   * @param {WorkerStats} workerStats - The payload for the job.
   * @returns {Promise<boolean>}
   */
  async scaleWorkers(workerStats) {
    if (this.workers.length === 0) {
      // There are no workers, need to add one
      for (let i = 0; i < 5; i++) {
        const worker = this.createWorker();
        this.workers.push(worker);
      }
      return true;
    }

    if (workerStats.load > JOBS_PER_WORKER) {
      // Find out how many more jobs we have than current workers can handle
      const excessJobs =
        workerStats.jobs.length - this.workers.length * JOBS_PER_WORKER;

      // Divide by jobs/worker to find out how many workers to add
      const workersToAdd = Math.ceil(excessJobs / JOBS_PER_WORKER);
      for (let i = 0; i < workersToAdd; i++) {
        const worker = this.createWorker();
        this.workers.push(worker);
      }
      return true;
    }

    if (workerStats.load < JOBS_PER_WORKER) {
      // Find out how much excess capacity we have
      const workerCapacity = this.workers.length * JOBS_PER_WORKER;
      const excessCapacity = workerCapacity - workerStats.jobs.length;
      // Calculate how many workers to remove
      const workersToRemove = Math.floor(excessCapacity / JOBS_PER_WORKER);
      if (this.workers.length > 5) {
        for (let i = 0; i < workersToRemove; i++) {
          const worker = this.workers.pop();
          try {
            await worker.close();
          } catch (error) {
            // Catch the error instead of throwing it
            logger.error(errorMessages.JOB_QUEUE_WORKER_CLOSE, {
              service: SERVICE_NAME,
            });
          }
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Gets all jobs in the queue.
   *
   * @async
   * @returns {Promise<Array<Job>>}
   * @throws {Error} - Throws error if getting jobs fails
   */
  async getJobs() {
    try {
      const jobs = await this.queue.getRepeatableJobs();
      return jobs;
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  async getJobStats() {
    try {
      const jobs = await this.queue.getJobs();
      const ret = await Promise.all(
        jobs.map(async (job) => {
          const state = await job.getState();
          return { url: job.data.url, state };
        })
      );
      return { jobs: ret, workers: this.workers.length };
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  /**
   * Adds a job to the queue and scales workers based on worker stats.
   *
   * @async
   * @param {string} jobName - The name of the job to be added.
   * @param {Monitor} payload - The payload for the job.
   * @throws {Error} - Will throw an error if the job cannot be added or workers don't scale
   */
  async addJob(jobName, payload) {
    try {
      console.log("Adding job", payload.url);
      // Execute job immediately
      await this.queue.add(jobName, payload);

      await this.queue.add(jobName, payload, {
        repeat: {
          every: payload.interval,
        },
      });
      const workerStats = await this.getWorkerStats();
      await this.scaleWorkers(workerStats);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Deletes a job from the queue.
   *
   * @async
   * @param {Monitor} monitor - The monitor to remove.
   * @throws {Error}
   */
  async deleteJob(monitor) {
    try {
      const deleted = await this.queue.removeRepeatable(monitor._id, {
        every: monitor.interval,
      });
      if (deleted) {
        logger.info(successMessages.JOB_QUEUE_DELETE_JOB, {
          service: SERVICE_NAME,
          jobId: monitor.id,
        });
      } else {
        logger.error(errorMessages.JOB_QUEUE_DELETE_JOB, {
          service: SERVICE_NAME,
          jobId: monitor.id,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async getMetrics() {
    try {
      const metrics = {
        waiting: await this.queue.getWaitingCount(),
        active: await this.queue.getActiveCount(),
        completed: await this.queue.getCompletedCount(),
        failed: await this.queue.getFailedCount(),
        delayed: await this.queue.getDelayedCount(),
        repeatableJobs: (await this.queue.getRepeatableJobs()).length,
      };
      return metrics;
    } catch (error) {
      logger.error("Failed to retrieve job queue metrics", {
        service: SERVICE_NAME,
        errorMsg: error.message,
      });
    }
  }

  /**
   * @async
   * @returns {Promise<boolean>} - Returns true if obliteration is successful
   */
  async obliterate() {
    try {
      let metrics = await this.getMetrics();
      console.log(metrics);
      await this.queue.pause();
      const jobs = await this.getJobs();

      for (const job of jobs) {
        await this.queue.removeRepeatableByKey(job.key);
        await this.queue.remove(job.id);
      }
      await Promise.all(
        this.workers.map(async (worker) => {
          await worker.close();
        })
      );

      await this.queue.obliterate();
      metrics = await this.getMetrics();
      console.log(metrics);
      logger.info(successMessages.JOB_QUEUE_OBLITERATE, {
        service: SERVICE_NAME,
      });
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = JobQueue;
