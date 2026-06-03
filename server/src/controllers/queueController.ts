import { IJobQueue } from "@/service/index.js";
import { getQueueJobsQueryValidation } from "@/validation/queueValidation.js";
import { Request, Response, NextFunction } from "express";

const SERVICE_NAME = "JobQueueController";

export interface IJobQueueController {
	getMetrics(req: Request, res: Response, next: NextFunction): Promise<void>;
	getJobs(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	getAllMetrics(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	flushQueue(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

class JobQueueController implements IJobQueueController {
	static SERVICE_NAME = SERVICE_NAME;
	private jobQueue: IJobQueue;
	constructor(jobQueue: IJobQueue) {
		this.jobQueue = jobQueue;
	}

	get serviceName() {
		return JobQueueController.SERVICE_NAME;
	}

	getMetrics = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const metrics = await this.jobQueue.getMetrics();
			res.status(200).json({
				success: true,
				msg: "Queue metrics fetched successfully",
				data: metrics,
			});
		} catch (error) {
			next(error);
		}
	};

	getJobs = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const pagination = getQueueJobsQueryValidation.parse(req.query);
			const { jobs, count } = await this.jobQueue.getJobs(pagination);
			return res.status(200).json({
				success: true,
				msg: "Queue jobs fetched successfully",
				data: { jobs, count },
			});
		} catch (error) {
			next(error);
		}
	};

	getAllMetrics = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const pagination = getQueueJobsQueryValidation.parse(req.query);
			const { jobs, count } = await this.jobQueue.getJobs(pagination);
			const metrics = await this.jobQueue.getMetrics();
			return res.status(200).json({
				success: true,
				msg: "Queue metrics fetched successfully",
				data: { jobs, count, metrics },
			});
		} catch (error) {
			next(error);
		}
	};

	flushQueue = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.jobQueue.flushQueues();
			return res.status(200).json({
				success: true,
				msg: "Queue flushed successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	};
}
export default JobQueueController;
