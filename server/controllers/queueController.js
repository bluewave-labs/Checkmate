import { handleError } from "./controllerUtils.js";

const SERVICE_NAME = "JobQueueController";

class JobQueueController {
	constructor(jobQueue, stringService) {
		this.jobQueue = jobQueue;
		this.stringService = stringService;
	}

	getMetrics = async (req, res, next) => {
		try {
			const metrics = await this.jobQueue.getMetrics();
			res.success({
				msg: this.stringService.queueGetMetrics,
				data: metrics,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMetrics"));
			return;
		}
	};

	getJobs = async (req, res, next) => {
		try {
			const jobs = await this.jobQueue.getJobs();
			return res.success({
				msg: this.stringService.queueGetMetrics,
				data: jobs,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getJobs"));
			return;
		}
	};

	addJob = async (req, res, next) => {
		try {
			await this.jobQueue.addJob(Math.random().toString(36).substring(7));
			return res.success({
				msg: this.stringService.queueAddJob,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "addJob"));
			return;
		}
	};

	flushQueue = async (req, res, next) => {
		try {
			const result = await this.jobQueue.flushQueues();
			return res.success({
				msg: this.stringService.jobQueueFlush,
				data: result,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "flushQueue"));
			return;
		}
	};

	checkQueueHealth = async (req, res, next) => {
		try {
			const stuckQueues = await this.jobQueue.checkQueueHealth();
			return res.success({
				msg: this.stringService.queueHealthCheck,
				data: stuckQueues,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "checkQueueHealth"));
			return;
		}
	};
}
export default JobQueueController;
