import Scheduler from "super-simple-scheduler";
const SERVICE_NAME = "JobQueue";

class SuperSimpleQueue {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ envSettings, db, logger, helper }) {
		this.envSettings = envSettings;
		this.db = db;
		this.logger = logger;
		this.helper = helper;
	}

	get serviceName() {
		return SuperSimpleQueue.SERVICE_NAME;
	}

	static async create({ envSettings, db, logger, helper }) {
		const instance = new SuperSimpleQueue({ envSettings, db, logger, helper });
		await instance.init();
		return instance;
	}

	init = async () => {
		try {
			this.scheduler = new Scheduler({
				// storeType: "mongo",
				// storeType: "redis",
				logLevel: "debug",
				debug: true,
				// dbUri: this.envSettings.dbConnectionString,
			});
			this.scheduler.start();

			this.scheduler.addTemplate("monitor-job", this.helper.getMonitorJob());
			this.scheduler.addTemplate("maintenance-job", this.helper.getMaintenanceJob());

			const monitors = await this.db.monitorModule.getAllMonitors();
			for (const monitor of monitors) {
				await this.addJob(monitor._id, monitor);
			}

			// Add periodic maintenance status update job (every 5 minutes)
			this.scheduler.addJob({
				id: "maintenance-status-update",
				template: "maintenance-job",
				repeat: 300000, // 5 minutes in milliseconds
			});
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
			template: "monitor-job",
			repeat: monitor.interval,
			active: monitor.isActive,
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
		this.scheduler.updateJob(monitor._id.toString(), { repeat: monitor.interval, data: monitor.toObject() });
	};

	shutdown = async () => {
		this.scheduler.stop();
	};

	getMetrics = async () => {
		const jobs = await this.scheduler.getJobs();
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
		const jobs = await this.scheduler.getJobs();
		return jobs.map((job) => {
			return {
				monitorId: job.id,
				monitorUrl: job?.data?.url || null,
				monitorType: job?.data?.type || null,
				monitorInterval: job?.data?.interval || null,
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
