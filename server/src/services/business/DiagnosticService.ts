import { IJobQueue } from "@/services/infrastructure/JobQueue.js";
import type {
  IJobData,
  IJobMetrics,
} from "@/services/infrastructure/JobQueue.js";
import { memoryTransport } from "@/logger/Logger.js";
import { config, type IEnvConfig } from "@/config/index.js";

export interface IDiagnosticService {
  getLogs: () => any[];
  getJobs: () => Promise<{
    jobs: IJobData[] | null;
    metrics: IJobMetrics | null;
  }>;
  getEnv: () => IEnvConfig;
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

  getEnv = (): IEnvConfig => {
    const mask = (val: string | undefined | null): string => {
      const isDev = (config.NODE_ENV || "").toLowerCase() === "development";
      if (isDev) return val ?? "";
      if (val === undefined || val === null) return "";
      if (val.length <= 4) return "***";
      return `${val.slice(0, 2)}***${val.slice(-2)}`;
    };

    return {
      NODE_ENV: config.NODE_ENV,
      DEPLOYMENT_MODE: config.DEPLOYMENT_MODE,
      LOG_LEVEL: config.LOG_LEVEL,
      ORIGIN: config.ORIGIN,
      JWT_SECRET: mask(config.JWT_SECRET),
      PORT: config.PORT,
      PAGESPEED_API_KEY: mask(config.PAGESPEED_API_KEY),
      SMTP_HOST: config.SMTP_HOST,
      SMTP_PORT: config.SMTP_PORT,
      SMTP_USER: mask(config.SMTP_USER),
      SMTP_PASS: mask(config.SMTP_PASS),
      STRIPE_SECRET: mask(config.STRIPE_SECRET),
      STRIPE_WEBHOOK_SECRET: mask(config.STRIPE_WEBHOOK_SECRET),
    };
  };
}

export default DiagnosticService;
