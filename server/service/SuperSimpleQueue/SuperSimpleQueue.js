import Scheduler from "super-simple-scheduler";
const SERVICE_NAME = "SuperSimpleQueue";

class SuperSimpleQueue {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ appSettings, db, logger, helper }) {
		this.appSettings = appSettings;
		this.db = db;
		this.logger = logger;
		this.helper = helper;
	}

	static async create({ appSettings, db, logger, helper }) {
		const instance = new SuperSimpleQueue({ appSettings, db, logger, helper });
		await instance.init();
		return instance;
	}

	init = async () => {
		try {
			this.scheduler = new Scheduler({
				logLevel: process.env.LOG_LEVEL,
				debug: process.env.NODE_ENV,
			});
			this.scheduler.start();
			this.scheduler.addTemplate("test", this.helper.getMonitorJob());
			const monitors = await this.db.getAllMonitors();
			for (const monitor of monitors) {
				await this.addJob(monitor._id, monitor);
			}
			return true;
		} catch (error) {
			this.logger.error({
				message: "Failed to initialize SuperSimpleQueue",
				service: SERVICE_NAME,
				method: "init",
				details: error,
			});
			return false;
		}
	};

	addJob = async (monitorId, monitor) => {
		this.scheduler.addJob({
			id: monitorId.toString(),
			template: "test",
			repeat: monitor.interval,
			data: monitor.toObject(),
		});
	};

	deleteJob = async (monitor) => {
		this.scheduler.removeJob(monitor._id.toString());
	};

	pauseJob = async (monitor) => {
		const result = this.scheduler.pauseJob(monitor._id.toString());
		if (result === false) {
			throw new Error("Failed to resume monitor");
		}
		this.logger.debug({
			message: `Paused monitor ${monitor._id}`,
			service: SERVICE_NAME,
			method: "pauseJob",
		});
	};

	resumeJob = async (monitor) => {
		const result = this.scheduler.resumeJob(monitor._id.toString());
		if (result === false) {
			throw new Error("Failed to resume monitor");
		}
		this.logger.debug({
			message: `Resumed monitor ${monitor._id}`,
			service: SERVICE_NAME,
			method: "resumeJob",
		});
	};

	updateJob = async (monitor) => {
		this.scheduler.updateJob(monitor._id.toString(), monitor.interval);
	};

	shutdown = async () => {
		this.scheduler.stop();
	};

	getMetrics = async () => {
		const jobs = this.scheduler.getJobs();
		const metrics = jobs.reduce(
			(acc, job) => {
				acc.totalRuns += job.runCount || 0;
				acc.totalFailures += job.failCount || 0;
				acc.jobs++;
				if (job.failCount > 0 && job.lastFailedAt >= job.lsatRunAt) {
					acc.failingJobs++;
				}

				if (job.lockedAt) {
					acc.activeJobs++;
				}

				if (job.failCount > 0) {
					acc.jobsWithFailures.push({
						monitorId: job.id,
						monitorUrl: job?.data?.url || null,
						monitorType: job?.data?.type || null,
						failedAt: job.lastFailedAt,
						failCount: job.failCount,
						failReason: job.lastFailReason,
					});
				}
				return acc;
			},
			{
				jobs: 0,
				activeJobs: 0,
				failingJobs: 0,
				jobsWithFailures: [],
				totalRuns: 0,
				totalFailures: 0,
			}
		);
		return metrics;
	};

	getJobs = async () => {
		const jobs = this.scheduler.getJobs();
		return jobs.map((job) => {
			return {
				monitorId: job.id,
				monitorUrl: job?.data?.url || null,
				monitorType: job?.data?.type || null,
				active: job.active,
				lockedAt: job.lockedAt,
				runCount: job.runCount || 0,
				failCount: job.failCount || 0,
				failReason: job.lastFailReason,
				lastRunAt: job.lastRunAt,
				lastFinishedAt: job.lastFinishedAt,
				lastRunTook: job.lockedAt ? null : job.lastFinishedAt - job.lastRunAt,
				lastFailedAt: job.lastFailedAt,
			};
		});
	};

	flushQueues = async () => {
		const stopRes = this.scheduler.stop();
		const flushRes = this.scheduler.flushJobs();
		const initRes = await this.init();
		return {
			success: stopRes && flushRes && initRes,
		};
	};

	obliterate = async () => {
		console.log("obliterate not implemented");
	};
}

export default SuperSimpleQueue;
