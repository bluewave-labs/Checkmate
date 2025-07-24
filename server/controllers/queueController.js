import BaseController from "./baseController.js";
const SERVICE_NAME = "JobQueueController";

class JobQueueController extends BaseController {
	constructor({ jobQueue, stringService, errorService }) {
		super();
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.errorService = errorService;
	}

	getMetrics = this.asyncHandler(
		async (req, res) => {
			const metrics = await this.jobQueue.getMetrics();
			res.success({
				msg: this.stringService.queueGetMetrics,
				data: metrics,
			});
		},
		SERVICE_NAME,
		"getMetrics"
	);

	getJobs = this.asyncHandler(
		async (req, res) => {
			const jobs = await this.jobQueue.getJobs();
			return res.success({
				msg: this.stringService.queueGetJobs,
				data: jobs,
			});
		},
		SERVICE_NAME,
		"getJobs"
	);

	getAllMetrics = this.asyncHandler(
		async (req, res) => {
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

	addJob = this.asyncHandler(
		async (req, res) => {
			await this.jobQueue.addJob(Math.random().toString(36).substring(7));
			return res.success({
				msg: this.stringService.queueAddJob,
			});
		},
		SERVICE_NAME,
		"addJob"
	);

	flushQueue = this.asyncHandler(
		async (req, res) => {
			const result = await this.jobQueue.flushQueues();
			return res.success({
				msg: this.stringService.jobQueueFlush,
				data: result,
			});
		},
		SERVICE_NAME,
		"flushQueue"
	);

	checkQueueHealth = this.asyncHandler(
		async (req, res) => {
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
