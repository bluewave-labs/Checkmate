import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "JobQueueController";

class JobQueueController {
	constructor(jobQueue, stringService) {
		this.jobQueue = jobQueue;
		this.stringService = stringService;
	}

	getMetrics = asyncHandler(
		async (req, res, next) => {
			const metrics = await this.jobQueue.getMetrics();
			res.success({
				msg: this.stringService.queueGetMetrics,
				data: metrics,
			});
		},
		SERVICE_NAME,
		"getMetrics"
	);

	getJobs = asyncHandler(
		async (req, res, next) => {
			const jobs = await this.jobQueue.getJobs();
			return res.success({
				msg: this.stringService.queueGetJobs,
				data: jobs,
			});
		},
		SERVICE_NAME,
		"getJobs"
	);

	getAllMetrics = asyncHandler(
		async (req, res, next) => {
			const jobs = await this.jobQueue.getJobs();
			const metrics = await this.jobQueue.getMetrics();
			return res.success({
				msg: this.stringService.queueGetAllMetrics,
				data: { jobs, metrics },
			});
		},
		SERVICE_NAME,
		"getAllMetrics"
	);

	addJob = asyncHandler(
		async (req, res, next) => {
			await this.jobQueue.addJob(Math.random().toString(36).substring(7));
			return res.success({
				msg: this.stringService.queueAddJob,
			});
		},
		SERVICE_NAME,
		"addJob"
	);

	flushQueue = asyncHandler(
		async (req, res, next) => {
			const result = await this.jobQueue.flushQueues();
			return res.success({
				msg: this.stringService.jobQueueFlush,
				data: result,
			});
		},
		SERVICE_NAME,
		"flushQueue"
	);

	checkQueueHealth = asyncHandler(
		async (req, res, next) => {
			const stuckQueues = await this.jobQueue.checkQueueHealth();
			return res.success({
				msg: this.stringService.queueHealthCheck,
				data: stuckQueues,
			});
		},
		SERVICE_NAME,
		"checkQueueHealth"
	);
}
export default JobQueueController;
