import { IJobQueue } from "@/services/infrastructure/JobQueue.js";

const SERVICE_NAME = "QueueService";

class QueueService {
  public SERVICE_NAME: string;
  private jobQueue: IJobQueue;

  constructor(jobQueue: IJobQueue) {
    this.jobQueue = jobQueue;
    this.SERVICE_NAME = SERVICE_NAME;
  }

  async getMetrics() {
    return await this.jobQueue.getMetrics();
  }

  async getJobs() {
    return await this.jobQueue.getJobs();
  }

  async flush() {
    return await this.jobQueue.flush();
  }
}

export default QueueService;
