import { IJobScheduler } from "@/worker/worker.interface.js";
import { getQueueJobsQueryValidation } from "@/api/validation/queueValidation.js";
import { Request, Response, RequestHandler } from "express";

export interface IJobQueueController {
	getMetrics: RequestHandler;
	getJobs: RequestHandler;
	getAllMetrics: RequestHandler;
	flushQueue: RequestHandler;
}

class JobQueueController implements IJobQueueController {
	constructor(private scheduler: IJobScheduler) {}

	getMetrics = async (req: Request, res: Response) => {
		const data = await this.scheduler.getMetrics();
		res.json({ success: true, msg: "Queue metrics fetched successfully", data });
	};

	getJobs = async (req: Request, res: Response) => {
		const pagination = getQueueJobsQueryValidation.parse(req.query);
		const data = await this.scheduler.getJobs(pagination);
		res.json({ success: true, msg: "Queue jobs fetched successfully", data });
	};

	getAllMetrics = async (req: Request, res: Response) => {
		const pagination = getQueueJobsQueryValidation.parse(req.query);
		const data = await this.scheduler.getJobs(pagination);
		const metrics = await this.scheduler.getMetrics();
		res.json({ success: true, msg: "Queue metrics fetched successfully", data: { ...data, metrics } });
	};

	flushQueue = async (req: Request, res: Response) => {
		const data = await this.scheduler.flushQueues();
		res.json({ success: true, msg: "Queue flushed successfully", data });
	};
}
export default JobQueueController;
