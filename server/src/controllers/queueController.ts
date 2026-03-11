import { ISuperSimpleQueue } from "@/service/index.js";
import { Request, Response, NextFunction } from "express";

const SERVICE_NAME = "JobQueueController";

class JobQueueController {
	static SERVICE_NAME = SERVICE_NAME;
	private jobQueue: ISuperSimpleQueue;
	constructor(jobQueue: ISuperSimpleQueue) {
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
			const jobs = await this.jobQueue.getJobs();
			return res.status(200).json({
				success: true,
				msg: "Queue jobs fetched successfully",
				data: jobs,
			});
		} catch (error) {
			next(error);
		}
	};

	getAllMetrics = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const jobs = await this.jobQueue.getJobs();
			const metrics = await this.jobQueue.getMetrics();
			return res.status(200).json({
				success: true,
				msg: "Queue metrics fetched successfully",
				data: { jobs, metrics },
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
