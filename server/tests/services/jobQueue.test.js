import sinon from "sinon";
import JobQueue from "../../service/jobQueue.js";
import { log } from "console";

class QueueStub {
	constructor(queueName, options) {
		this.queueName = queueName;
		this.options = options;
		this.workers = [];
		this.jobs = [];
	}

	// Add any methods that are expected to be called on the Queue instance
	add(job) {
		this.jobs.push(job);
	}

	removeRepeatable(id) {
		const removedJob = this.jobs.find((job) => job.data._id === id);
		this.jobs = this.jobs.filter((job) => job.data._id !== id);
		if (removedJob) {
			return true;
		}
		return false;
	}

	getRepeatableJobs() {
		return this.jobs;
	}
	async getJobs() {
		return this.jobs;
	}

	async pause() {
		return true;
	}

	async obliterate() {
		return true;
	}
}

class WorkerStub {
	constructor(QUEUE_NAME, workerTask) {
		this.queueName = QUEUE_NAME;
		this.workerTask = async () => workerTask({ data: { _id: 1 } });
	}

	async close() {
		return true;
	}
}

describe("JobQueue", function () {
	let settingsService, logger, db, networkService, statusService, notificationService, jobQueue;

	beforeEach(async function () {
		settingsService = { getSettings: sinon.stub() };
		statusService = { updateStatus: sinon.stub() };
		notificationService = { handleNotifications: sinon.stub() };

		logger = { error: sinon.stub(), info: sinon.stub() };
		db = {
			getAllMonitors: sinon.stub().returns([]),
			getMaintenanceWindowsByMonitorId: sinon.stub().returns([]),
		};
		networkService = { getStatus: sinon.stub() };
		jobQueue = await JobQueue.createJobQueue(db, networkService, statusService, notificationService, settingsService, logger, QueueStub, WorkerStub);
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("createJobQueue", function () {
		it("should create a new JobQueue and add jobs for active monitors", async function () {
			db.getAllMonitors.returns([
				{ id: 1, isActive: true },
				{ id: 2, isActive: true },
			]);
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			// There should be double the jobs, as one is meant to be instantly executed
			// And one is meant to be enqueued
			expect(jobQueue.queue.jobs.length).to.equal(4);
		});

		it("should reject with an error if an error occurs", async function () {
			db.getAllMonitors.throws("Error");
			try {
				const jobQueue = await JobQueue.createJobQueue(
					db,
					networkService,
					statusService,
					notificationService,
					settingsService,
					logger,
					QueueStub,
					WorkerStub
				);
			} catch (error) {
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("createJobQueue");
			}
		});

		it("should reject with an error if an error occurs, should not overwrite error data", async function () {
			const error = new Error("Error");
			error.service = "otherService";
			error.method = "otherMethod";
			db.getAllMonitors.throws(error);

			try {
				const jobQueue = await JobQueue.createJobQueue(
					db,
					networkService,
					statusService,
					notificationService,
					settingsService,
					logger,
					QueueStub,
					WorkerStub
				);
			} catch (error) {
				expect(error.service).to.equal("otherService");
				expect(error.method).to.equal("otherMethod");
			}
		});
	});

	describe("Constructor", function () {
		it("should construct a new JobQueue with default port and host if not provided", async function () {
			settingsService.getSettings.returns({});

			expect(jobQueue.connection.host).to.equal("127.0.0.1");
			expect(jobQueue.connection.port).to.equal(6379);
		});

		it("should construct a new JobQueue with provided port and host", async function () {
			settingsService.getSettings.returns({ redisHost: "localhost", redisPort: 1234 });
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			expect(jobQueue.connection.host).to.equal("localhost");
			expect(jobQueue.connection.port).to.equal(1234);
		});
	});

	describe("isMaintenanceWindow", function () {
		it("should throw an error if error occurs", async function () {
			db.getMaintenanceWindowsByMonitorId.throws("Error");
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			try {
				jobQueue.isInMaintenanceWindow(1);
			} catch (error) {
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("createWorker");
			}
		});

		it("should return true if in maintenance window with no repeat", async function () {
			db.getMaintenanceWindowsByMonitorId.returns([
				{
					active: true,
					start: new Date(Date.now() - 1000).toISOString(),
					end: new Date(Date.now() + 1000).toISOString(),
					repeat: 0,
				},
			]);
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			const inWindow = await jobQueue.isInMaintenanceWindow(1);
			expect(inWindow).to.be.true;
		});

		it("should return true if in maintenance window with repeat", async function () {
			db.getMaintenanceWindowsByMonitorId.returns([
				{
					active: true,
					start: new Date(Date.now() - 10000).toISOString(),
					end: new Date(Date.now() - 5000).toISOString(),
					repeat: 1000,
				},
			]);
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			const inWindow = await jobQueue.isInMaintenanceWindow(1);
			expect(inWindow).to.be.true;
		});

		it("should return false if in end < start", async function () {
			db.getMaintenanceWindowsByMonitorId.returns([
				{
					active: true,
					start: new Date(Date.now() - 5000).toISOString(),
					end: new Date(Date.now() - 10000).toISOString(),
					repeat: 1000,
				},
			]);
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			const inWindow = await jobQueue.isInMaintenanceWindow(1);
			expect(inWindow).to.be.false;
		});

		it("should return false if not in maintenance window", async function () {
			db.getMaintenanceWindowsByMonitorId.returns([
				{
					active: false,
					start: new Date(Date.now() - 5000).toISOString(),
					end: new Date(Date.now() - 10000).toISOString(),
					repeat: 1000,
				},
			]);
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			const inWindow = await jobQueue.isInMaintenanceWindow(1);
			expect(inWindow).to.be.false;
		});
	});

	describe("createJobHandler", function () {
		it("resolve to an error if an error is thrown within", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.isInMaintenanceWindow = sinon.stub().throws("Error");
			try {
				const handler = jobQueue.createJobHandler();
				await handler({ data: { _id: 1 } });
			} catch (error) {
				expect(error.service).to.equal("JobQueue");
				expect(error.details).to.equal(`Error processing job 1: Error`);
			}
		});

		it("should log info if job is in maintenance window", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.isInMaintenanceWindow = sinon.stub().returns(true);
			const handler = jobQueue.createJobHandler();
			await handler({ data: { _id: 1 } });
			expect(logger.info.calledOnce).to.be.true;
			expect(logger.info.firstCall.args[0].message).to.equal("Monitor 1 is in maintenance window");
		});

		it("should return if status has not changed", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.isInMaintenanceWindow = sinon.stub().returns(false);
			statusService.updateStatus = sinon.stub().returns({ statusChanged: false });
			const handler = jobQueue.createJobHandler();
			await handler({ data: { _id: 1 } });
			expect(jobQueue.notificationService.handleNotifications.notCalled).to.be.true;
		});

		it("should return if status has changed, but prevStatus was undefined (monitor paused)", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.isInMaintenanceWindow = sinon.stub().returns(false);
			statusService.updateStatus = sinon.stub().returns({ statusChanged: true, prevStatus: undefined });
			const handler = jobQueue.createJobHandler();
			await handler({ data: { _id: 1 } });
			expect(jobQueue.notificationService.handleNotifications.notCalled).to.be.true;
		});

		it("should call notification service if status changed and monitor was not paused", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.isInMaintenanceWindow = sinon.stub().returns(false);
			statusService.updateStatus = sinon.stub().returns({ statusChanged: true, prevStatus: false });
			const handler = jobQueue.createJobHandler();
			await handler({ data: { _id: 1 } });
			expect(jobQueue.notificationService.handleNotifications.calledOnce).to.be.true;
		});
	});

	describe("getWorkerStats", function () {
		it("should throw an error if getRepeatable Jobs fails", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.queue.getRepeatableJobs = async () => {
				throw new Error("Error");
			};
			try {
				const stats = await jobQueue.getWorkerStats();
			} catch (error) {
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("getWorkerStats");
			}
		});

		it("should throw an error if getRepeatable Jobs fails but respect existing error data", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.queue.getRepeatableJobs = async () => {
				const error = new Error("Existing Error");
				error.service = "otherService";
				error.method = "otherMethod";
				throw error;
			};
			try {
				await jobQueue.getWorkerStats();
			} catch (error) {
				expect(error.service).to.equal("otherService");
				expect(error.method).to.equal("otherMethod");
			}
		});
	});

	describe("scaleWorkers", function () {
		it("should scale workers to 5 if no workers", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			expect(jobQueue.workers.length).to.equal(5);
		});

		it("should scale workers up", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			jobQueue.scaleWorkers({
				load: 100,
				jobs: Array.from({ length: 100 }, (_, i) => i + 1),
			});
			expect(jobQueue.workers.length).to.equal(20);
		});

		it("should scale workers down, even with error of worker.close fails", async function () {
			WorkerStub.prototype.close = async () => {
				throw new Error("Error");
			};
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			await jobQueue.scaleWorkers({
				load: 100,
				jobs: Array.from({ length: 100 }, (_, i) => i + 1),
			});

			const res = await jobQueue.scaleWorkers({
				load: 0,
				jobs: [],
			});
			expect(jobQueue.workers.length).to.equal(5);
		});

		it("should scale workers down", async function () {
			WorkerStub.prototype.close = async () => {
				return true;
			};
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			await jobQueue.scaleWorkers({
				load: 40,
				jobs: Array.from({ length: 40 }, (_, i) => i + 1),
			});

			const res = await jobQueue.scaleWorkers({
				load: 0,
				jobs: [],
			});
			expect(jobQueue.workers.length).to.equal(5);
		});

		it("should return false if scaling doesn't happen", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			const res = await jobQueue.scaleWorkers({ load: 5 });
			expect(jobQueue.workers.length).to.equal(5);
			expect(res).to.be.false;
		});
	});

	describe("getJobs", function () {
		it("should return jobs", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			const jobs = await jobQueue.getJobs();
			expect(jobs.length).to.equal(0);
		});

		it("should throw an error if getRepeatableJobs fails", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			try {
				jobQueue.queue.getRepeatableJobs = async () => {
					throw new Error("error");
				};

				await jobQueue.getJobs(true);
			} catch (error) {
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("getJobs");
			}
		});

		it("should throw an error if getRepeatableJobs fails but respect existing error data", async function () {
			const jobQueue = await JobQueue.createJobQueue(
				db,
				networkService,
				statusService,
				notificationService,
				settingsService,
				logger,
				QueueStub,
				WorkerStub
			);
			try {
				jobQueue.queue.getRepeatableJobs = async () => {
					const error = new Error("Existing error");
					error.service = "otherService";
					error.method = "otherMethod";
					throw error;
				};

				await jobQueue.getJobs(true);
			} catch (error) {
				expect(error.service).to.equal("otherService");
				expect(error.method).to.equal("otherMethod");
			}
		});
	});

	describe("getJobStats", function () {
		it("should return job stats for no jobs", async function () {
			const jobStats = await jobQueue.getJobStats();
			expect(jobStats).to.deep.equal({ jobs: [], workers: 5 });
		});

		it("should return job stats for jobs", async function () {
			jobQueue.queue.getJobs = async () => {
				return [{ data: { url: "test" }, getState: async () => "completed" }];
			};
			const jobStats = await jobQueue.getJobStats();
			expect(jobStats).to.deep.equal({
				jobs: [{ url: "test", state: "completed" }],
				workers: 5,
			});
		});

		it("should reject with an error if mapping jobs fails", async function () {
			jobQueue.queue.getJobs = async () => {
				return [
					{
						data: { url: "test" },
						getState: async () => {
							throw new Error("Mapping Error");
						},
					},
				];
			};
			try {
				await jobQueue.getJobStats();
			} catch (error) {
				expect(error.message).to.equal("Mapping Error");
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("getJobStats");
			}
		});

		it("should reject with an error if mapping jobs fails but respect existing error data", async function () {
			jobQueue.queue.getJobs = async () => {
				return [
					{
						data: { url: "test" },
						getState: async () => {
							const error = new Error("Mapping Error");
							error.service = "otherService";
							error.method = "otherMethod";
							throw error;
						},
					},
				];
			};
			try {
				await jobQueue.getJobStats();
			} catch (error) {
				expect(error.message).to.equal("Mapping Error");
				expect(error.service).to.equal("otherService");
				expect(error.method).to.equal("otherMethod");
			}
		});
	});

	describe("addJob", function () {
		it("should add a job to the queue", async function () {
			jobQueue.addJob("test", { url: "test" });
			expect(jobQueue.queue.jobs.length).to.equal(1);
		});

		it("should reject with an error if adding fails", async function () {
			jobQueue.queue.add = async () => {
				throw new Error("Error adding job");
			};
			try {
				await jobQueue.addJob("test", { url: "test" });
			} catch (error) {
				expect(error.message).to.equal("Error adding job");
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("addJob");
			}
		});

		it("should reject with an error if adding fails but respect existing error data", async function () {
			jobQueue.queue.add = async () => {
				const error = new Error("Error adding job");
				error.service = "otherService";
				error.method = "otherMethod";
				throw error;
			};
			try {
				await jobQueue.addJob("test", { url: "test" });
			} catch (error) {
				expect(error.message).to.equal("Error adding job");
				expect(error.service).to.equal("otherService");
				expect(error.method).to.equal("otherMethod");
			}
		});
	});

	describe("deleteJob", function () {
		it("should delete a job from the queue", async function () {
			jobQueue.getWorkerStats = sinon.stub().returns({ load: 1, jobs: [{}] });
			jobQueue.scaleWorkers = sinon.stub();
			const monitor = { _id: 1 };
			const job = { data: monitor };
			jobQueue.queue.jobs = [job];
			await jobQueue.deleteJob(monitor);
			// expect(jobQueue.queue.jobs.length).to.equal(0);
			// expect(logger.info.calledOnce).to.be.true;
			// expect(jobQueue.getWorkerStats.calledOnce).to.be.true;
			// expect(jobQueue.scaleWorkers.calledOnce).to.be.true;
		});

		it("should log an error if job is not found", async function () {
			jobQueue.getWorkerStats = sinon.stub().returns({ load: 1, jobs: [{}] });
			jobQueue.scaleWorkers = sinon.stub();
			const monitor = { _id: 1 };
			const job = { data: monitor };
			jobQueue.queue.jobs = [job];
			await jobQueue.deleteJob({ id_: 2 });
			expect(logger.error.calledOnce).to.be.true;
		});

		it("should reject with an error if removeRepeatable fails", async function () {
			jobQueue.queue.removeRepeatable = async () => {
				const error = new Error("removeRepeatable error");
				throw error;
			};

			try {
				await jobQueue.deleteJob({ _id: 1 });
			} catch (error) {
				expect(error.message).to.equal("removeRepeatable error");
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("deleteJob");
			}
		});

		it("should reject with an error if removeRepeatable fails but respect existing error data", async function () {
			jobQueue.queue.removeRepeatable = async () => {
				const error = new Error("removeRepeatable error");
				error.service = "otherService";
				error.method = "otherMethod";
				throw error;
			};

			try {
				await jobQueue.deleteJob({ _id: 1 });
			} catch (error) {
				expect(error.message).to.equal("removeRepeatable error");
				expect(error.service).to.equal("otherService");
				expect(error.method).to.equal("otherMethod");
			}
		});
	});

	describe("getMetrics", function () {
		it("should return metrics for the job queue", async function () {
			jobQueue.queue.getWaitingCount = async () => 1;
			jobQueue.queue.getActiveCount = async () => 2;
			jobQueue.queue.getCompletedCount = async () => 3;
			jobQueue.queue.getFailedCount = async () => 4;
			jobQueue.queue.getDelayedCount = async () => 5;
			jobQueue.queue.getRepeatableJobs = async () => [1, 2, 3];
			const metrics = await jobQueue.getMetrics();
			expect(metrics).to.deep.equal({
				waiting: 1,
				active: 2,
				completed: 3,
				failed: 4,
				delayed: 5,
				repeatableJobs: 3,
			});
		});

		it("should log an error if metrics operations fail", async function () {
			jobQueue.queue.getWaitingCount = async () => {
				throw new Error("Error");
			};
			await jobQueue.getMetrics();
			expect(logger.error.calledOnce).to.be.true;
			expect(logger.error.firstCall.args[0].message).to.equal("Error");
		});
	});

	describe("obliterate", function () {
		it("should return true if obliteration is successful", async function () {
			jobQueue.queue.pause = async () => true;
			jobQueue.getJobs = async () => [{ key: 1, id: 1 }];
			jobQueue.queue.removeRepeatableByKey = async () => true;
			jobQueue.queue.remove = async () => true;
			jobQueue.queue.obliterate = async () => true;
			const obliteration = await jobQueue.obliterate();
			expect(obliteration).to.be.true;
		});

		it("should throw an error if obliteration fails", async function () {
			jobQueue.getMetrics = async () => {
				throw new Error("Error");
			};

			try {
				await jobQueue.obliterate();
			} catch (error) {
				expect(error.service).to.equal("JobQueue");
				expect(error.method).to.equal("obliterate");
			}
		});

		it("should throw an error if obliteration fails but respect existing error data", async function () {
			jobQueue.getMetrics = async () => {
				const error = new Error("Error");
				error.service = "otherService";
				error.method = "otherMethod";
				throw error;
			};

			try {
				await jobQueue.obliterate();
			} catch (error) {
				expect(error.service).to.equal("otherService");
				expect(error.method).to.equal("otherMethod");
			}
		});
	});
});
