import { IJobQueue } from "../infrastructure/JobQueue.js";

class QueueService {
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
