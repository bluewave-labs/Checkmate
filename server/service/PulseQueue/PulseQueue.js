import { Pulse } from "@pulsecron/pulse";

const SERVICE_NAME = "PulseQueue";
class PulseQueue {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ appSettings, db, pulseQueueHelper, logger }) {
		this.db = db;
		this.appSettings = appSettings;
		this.pulseQueueHelper = pulseQueueHelper;
		this.logger = logger;
	}

	static async create({ appSettings, db, pulseQueueHelper, logger }) {
		const instance = new PulseQueue({ appSettings, db, pulseQueueHelper, logger });
		await instance.init();
		return instance;
	}

	// ****************************************
	// Core methods
	// ****************************************
	init = async () => {
		try {
			const mongoConnectionString =
				this.appSettings.dbConnectionString || "mongodb://localhost:27017/uptime_db";
			this.pulse = new Pulse({ db: { address: mongoConnectionString } });
			await this.pulse.start();
			this.pulse.define("monitor-job", this.pulseQueueHelper.getMonitorJob(), {});

			const monitors = await this.db.getAllMonitors();
			for (const monitor of monitors) {
				await this.addJob(monitor._id, monitor);
			}
			return true;
		} catch (error) {
			this.logger.error({
				message: "Failed to initialize PulseQueue",
				service: SERVICE_NAME,
				method: "init",
				details: error,
			});
			return false;
		}
	};

	addJob = async (monitorId, monitor) => {
		this.logger.debug({
			message: `Adding job ${monitor?.url ?? "No URL"}`,
			service: SERVICE_NAME,
			method: "addJob",
		});
		const intervalInSeconds = monitor.interval / 1000;
		const job = this.pulse.create("monitor-job", {
			monitor,
		});
		job.unique({ "data.monitor._id": monitor._id });
		job.attrs.jobId = monitorId.toString();
		job.repeatEvery(`${intervalInSeconds} seconds`);
		if (monitor.isActive === false) {
			job.disable();
		}
		await job.save();
	};

	deleteJob = async (monitor) => {
		this.logger.debug({
			message: `Deleting job ${monitor?.url ?? "No URL"}`,
			service: SERVICE_NAME,
			method: "deleteJob",
		});
		await this.pulse.cancel({
			"data.monitor._id": monitor._id,
		});
	};

	pauseJob = async (monitor) => {
		const result = await this.pulse.disable({
			"data.monitor._id": monitor._id,
		});

		if (result.length < 1) {
			throw new Error("Failed to pause monitor");
		}

		this.logger.debug({
			message: `Paused monitor ${monitor._id}`,
			service: SERVICE_NAME,
			method: "pauseJob",
		});
	};

	resumeJob = async (monitor) => {
		const result = await this.pulse.enable({
			"data.monitor._id": monitor._id,
		});

		if (result.length < 1) {
			throw new Error("Failed to resume monitor");
		}

		this.logger.debug({
			message: `Resumed monitor ${monitor._id}`,
			service: SERVICE_NAME,
			method: "resumeJob",
		});
	};

	updateJob = async (monitor) => {
		const jobs = await this.pulse.jobs({
			"data.monitor._id": monitor._id,
		});

		const job = jobs[0];
		if (!job) {
			throw new Error("Job not found");
		}

		const intervalInSeconds = monitor.interval / 1000;
		job.repeatEvery(`${intervalInSeconds} seconds`);
		job.attrs.data.monitor = monitor;
		await job.save();
	};

	shutdown = async () => {
		this.logger.info({
			message: "Shutting down JobQueue",
			service: SERVICE_NAME,
			method: "shutdown",
		});
		await this.pulse.stop();
	};

	// ****************************************
	// Diagnostic methods
	// ****************************************

	getMetrics = async () => {
		const jobs = await this.pulse.jobs();
		const metrics = jobs.reduce(
			(acc, job) => {
				acc.jobs++;
				if (job.attrs.failCount > 0 && job.attrs.failedAt >= job.attrs.lastFinishedAt) {
					acc.failingJobs++;
				}
				if (job.attrs.lockedAt) {
					acc.activeJobs++;
				}
				if (job.attrs.failCount > 0) {
					acc.jobsWithFailures.push({
						monitorId: job.attrs.data.monitor._id,
						monitorUrl: job.attrs.data.monitor.url,
						failCount: job.attrs.failCount,
						failReason: job.attrs.failReason,
					});
				}
				return acc;
			},
			{ jobs: 0, activeJobs: 0, failingJobs: 0, jobsWithFailures: [] }
		);
		return metrics;
	};

	getJobs = async () => {
		const jobs = await this.pulse.jobs();
		return jobs.map((job) => {
			return {
				monitorId: job.attrs.data.monitor._id,
				monitorUrl: job.attrs.data.monitor.url,
				lockedAt: job.attrs.lockedAt,
				runCount: job.attrs.runCount || 0,
				failCount: job.attrs.failCount || 0,
				failReason: job.attrs.failReason,
			};
		});
	};

	flushQueues = async () => {
		const cancelRes = await this.pulse.cancel();
		await this.pulse.stop();
		const initRes = await this.init();
		return {
			flushedJobs: cancelRes,
			initSuccess: initRes,
		};
	};

	obliterate = async () => {
		await this.flushQueues();
	};
}

export default PulseQueue;
