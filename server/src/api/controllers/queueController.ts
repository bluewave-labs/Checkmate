import { IJobScheduler } from "@/worker/worker.interface.js";
import { getQueueJobsQueryValidation } from "@/api/validation/queueValidation.js";
import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";

export interface IJobQueueController {
	getMetrics: RequestHandler;
	getJobs: RequestHandler;
	getAllMetrics: RequestHandler;
	flushQueue: RequestHandler;
}

class JobQueueController implements IJobQueueController {
	constructor(private scheduler: IJobScheduler) {}

	getMetrics = catchAsync(async (req: Request, res: Response) => {
		const metrics = await this.scheduler.getMetrics();
		res.status(200).json({
			success: true,
			msg: "Queue metrics fetched successfully",
			data: metrics,
		});
	});

	getJobs = catchAsync(async (req: Request, res: Response) => {
		const pagination = getQueueJobsQueryValidation.parse(req.query);
		const { jobs, count } = await this.scheduler.getJobs(pagination);
		return res.status(200).json({
			success: true,
			msg: "Queue jobs fetched successfully",
			data: { jobs, count },
		});
	});

	getAllMetrics = catchAsync(async (req: Request, res: Response) => {
		const pagination = getQueueJobsQueryValidation.parse(req.query);
		const { jobs, count } = await this.scheduler.getJobs(pagination);
		const metrics = await this.scheduler.getMetrics();
		return res.status(200).json({
			success: true,
			msg: "Queue metrics fetched successfully",
			data: { jobs, count, metrics },
		});
	});

	flushQueue = catchAsync(async (req: Request, res: Response) => {
		const result = await this.scheduler.flushQueues();
		return res.status(200).json({
			success: true,
			msg: "Queue flushed successfully",
			data: result,
		});
	});
}
export default JobQueueController;
