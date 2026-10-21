import { IJobScheduler } from "@/worker/worker.interface.js";
import { getQueueJobsQueryValidation } from "@/api/validation/queueValidation.js";
import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";

export interface IJobQueueController {
	getMetrics: RequestHandler;
	getJobs: RequestHandler;
	getAllMetrics: RequestHandler;
	flushQueue: RequestHandler;
}

class JobQueueController implements IJobQueueController {
	constructor(private scheduler: IJobScheduler) {}

	getMetrics: Handler = async (req, res) => {
		const data = await this.scheduler.getMetrics();
		res.json({ success: true, msg: "Queue metrics fetched successfully", data });
	};

	getJobs: Handler = async (req, res) => {
		const pagination = getQueueJobsQueryValidation.parse(req.query);
		const data = await this.scheduler.getJobs(pagination);
		res.json({ success: true, msg: "Queue jobs fetched successfully", data });
	};

	getAllMetrics: Handler = async (req, res) => {
		const pagination = getQueueJobsQueryValidation.parse(req.query);
		const data = await this.scheduler.getJobs(pagination);
		const metrics = await this.scheduler.getMetrics();
		res.json({ success: true, msg: "Queue metrics fetched successfully", data: { ...data, metrics } });
	};

	flushQueue: Handler = async (req, res) => {
		await this.scheduler.flushQueues();
		res.json({ success: true, msg: "Queue flushed successfully" });
	};
}
export default JobQueueController;
