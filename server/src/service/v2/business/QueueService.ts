import { IJobQueue } from "../infrastructure/JobQueue.js";

const SERVICE_NAME = "QueueServiceV2";

class QueueService {
	static SERVICE_NAME = SERVICE_NAME;
	private jobQueue: IJobQueue;

	constructor(jobQueue: IJobQueue) {
		this.jobQueue = jobQueue;
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
