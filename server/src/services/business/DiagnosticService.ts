import { IJobQueue } from "@/services/infrastructure/JobQueue.js";
import type {
  IJobData,
  IJobMetrics,
} from "@/services/infrastructure/JobQueue.js";
import { memoryTransport } from "@/logger/Logger.js";

export interface IDiagnosticService {
  getLogs: () => any[];
  getJobs: () => Promise<{
    jobs: IJobData[] | null;
    metrics: IJobMetrics | null;
  }>;
}

const SERVICE_NAME = "DiagnosticService";
class DiagnosticService implements IDiagnosticService {
  public SERVICE_NAME: string;
  private jobQueue: IJobQueue;

  constructor(jobQueue: IJobQueue) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.jobQueue = jobQueue;
  }

  getLogs = () => {
    return memoryTransport.getLogs();
  };

  getJobs = async () => {
    const jobs = await this.jobQueue.getJobs();
    const metrics = await this.jobQueue.getMetrics();
    return { jobs, metrics };
  };
}

export default DiagnosticService;
