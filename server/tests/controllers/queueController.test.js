import { afterEach } from "node:test";
import { getMetrics, getJobs, addJob, obliterateQueue } from "../../controllers/queueController.js";
import { successMessages } from "../../utils/messages.js";
import sinon from "sinon";

describe("Queue Controller - getMetrics", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {},
			body: {},
			db: {},
			jobQueue: {
				getMetrics: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should throw an error if getMetrics throws an error", async function () {
		req.jobQueue.getMetrics.throws(new Error("getMetrics error"));
		await getMetrics(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("getMetrics error");
	});

	it("should return a success message and data if getMetrics is successful", async function () {
		const data = { data: "metrics" };
		req.jobQueue.getMetrics.returns(data);
		await getMetrics(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(res.json.firstCall.args[0]).to.deep.equal({
			success: true,
			msg: successMessages.QUEUE_GET_METRICS,
			data,
		});
	});
});

describe("Queue Controller - getJobs", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {},
			body: {},
			db: {},
			jobQueue: {
				getJobStats: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should reject with an error if getJobs throws an error", async function () {
		req.jobQueue.getJobStats.throws(new Error("getJobs error"));
		await getJobs(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("getJobs error");
	});

	it("should return a success message and data if getJobs is successful", async function () {
		const data = { data: "jobs" };
		req.jobQueue.getJobStats.returns(data);
		await getJobs(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(res.json.firstCall.args[0]).to.deep.equal({
			success: true,
			msg: successMessages.QUEUE_GET_METRICS,
			data,
		});
	});
});

describe("Queue Controller - addJob", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {},
			body: {},
			db: {},
			jobQueue: {
				addJob: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should reject with an error if addJob throws an error", async function () {
		req.jobQueue.addJob.throws(new Error("addJob error"));
		await addJob(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("addJob error");
	});

	it("should return a success message if addJob is successful", async function () {
		req.jobQueue.addJob.resolves();
		await addJob(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(res.json.firstCall.args[0]).to.deep.equal({
			success: true,
			msg: successMessages.QUEUE_ADD_JOB,
		});
	});
});

describe("Queue Controller - obliterateQueue", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {},
			body: {},
			db: {},
			jobQueue: {
				obliterate: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should reject with an error if obliterateQueue throws an error", async function () {
		req.jobQueue.obliterate.throws(new Error("obliterateQueue error"));
		await obliterateQueue(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("obliterateQueue error");
	});

	it("should return a success message if obliterateQueue is successful", async function () {
		req.jobQueue.obliterate.resolves();
		await obliterateQueue(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(res.json.firstCall.args[0]).to.deep.equal({
			success: true,
			msg: successMessages.QUEUE_OBLITERATE,
		});
	});
});
