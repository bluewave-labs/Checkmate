import {
	getAllMonitors,
	getAllMonitorsWithUptimeStats,
	getMonitorStatsById,
	getMonitorCertificate,
	getMonitorById,
	getMonitorsAndSummaryByTeamId,
	getMonitorsByTeamId,
	createMonitor,
	checkEndpointResolution,
	deleteMonitor,
	deleteAllMonitors,
	editMonitor,
	pauseMonitor,
	addDemoMonitors,
} from "../../controllers/monitorController.js";
import jwt from "jsonwebtoken";
import sinon from "sinon";
import { successMessages } from "../../utils/messages.js";
import logger from "../../utils/logger.js";
import axios from "axios";
const SERVICE_NAME = "monitorController";

describe("Monitor Controller - getAllMonitors", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {},
			query: {},
			body: {},
			db: {
				getAllMonitors: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getAllMonitors.throws(new Error("DB error"));
		await getAllMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message and data if all operations succeed", async function () {
		const data = [{ monitor: "data" }];
		req.db.getAllMonitors.returns(data);
		await getAllMonitors(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_GET_ALL,
				data: data,
			})
		).to.be.true;
	});
});
describe("Monitor Controller - getAllMonitorsWithUptimeStats", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {},
			query: {},
			body: {},
			db: {
				getAllMonitorsWithUptimeStats: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getAllMonitorsWithUptimeStats.throws(new Error("DB error"));
		await getAllMonitorsWithUptimeStats(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message and data if all operations succeed", async function () {
		const data = [{ monitor: "data" }];
		req.db.getAllMonitorsWithUptimeStats.returns(data);
		await getAllMonitorsWithUptimeStats(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_GET_ALL,
				data: data,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - getMonitorStatsById", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {
				monitorId: "123",
			},
			query: {},
			body: {},
			db: {
				getMonitorStatsById: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await getMonitorStatsById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if query validation fails", async function () {
		req.query = { invalid: 1 };
		await getMonitorStatsById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getMonitorStatsById.throws(new Error("DB error"));
		await getMonitorStatsById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message and data if all operations succeed", async function () {
		const data = [{ monitorStats: "data" }];
		req.db.getMonitorStatsById.returns(data);
		await getMonitorStatsById(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_STATS_BY_ID,
				data: data,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - getMonitorCertificate", function () {
	let req, res, next, fetchMonitorCertificate;

	beforeEach(function () {
		req = {
			params: {
				monitorId: "123",
			},
			query: {},
			body: {},
			db: {
				getMonitorById: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
		fetchMonitorCertificate = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await getMonitorCertificate(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if getMonitorById operation fails", async function () {
		req.db.getMonitorById.throws(new Error("DB error"));
		await getMonitorCertificate(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message and data if all operations succeed with a valid cert", async function () {
		req.db.getMonitorById.returns({ url: "https://www.google.com" });
		const data = { certificate: "cert", validTo: "2024/08/08" };
		fetchMonitorCertificate.returns(data);
		await getMonitorCertificate(req, res, next, fetchMonitorCertificate);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_CERTIFICATE,
				data: { certificateDate: new Date(data.validTo) },
			})
		).to.be.true;
	});

	it("should return an error if fetchMonitorCertificate fails", async function () {
		req.db.getMonitorById.returns({ url: "https://www.google.com" });
		fetchMonitorCertificate.throws(new Error("Certificate error"));
		await getMonitorCertificate(req, res, next, fetchMonitorCertificate);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Certificate error");
	});
});

describe("Monitor Controller - getMonitorById", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {
				monitorId: "123",
			},
			query: {},
			body: {},
			db: {
				getMonitorById: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await getMonitorById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if query param validation fails", async function () {
		req.query = { invalid: 1 };
		await getMonitorById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getMonitorById.throws(new Error("DB error"));
		await getMonitorById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return 404 if a monitor is not found", async function () {
		const error = new Error("Monitor not found");
		error.status = 404;
		req.db.getMonitorById.throws(error);
		await getMonitorById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(404);
	});

	it("should return success message and data if all operations succeed", async function () {
		const data = { monitor: "data" };
		req.db.getMonitorById.returns(data);
		await getMonitorById(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_GET_BY_ID,
				data: data,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - getMonitorsAndSummaryByTeamId", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {
				teamId: "123",
			},
			query: {},
			body: {},
			db: {
				getMonitorsAndSummaryByTeamId: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await getMonitorsAndSummaryByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if query validation fails", async function () {
		req.query = { invalid: 1 };
		await getMonitorsAndSummaryByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getMonitorsAndSummaryByTeamId.throws(new Error("DB error"));
		await getMonitorsAndSummaryByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message and data if all operations succeed", async function () {
		const data = { monitors: "data", summary: "data" };
		req.db.getMonitorsAndSummaryByTeamId.returns(data);
		await getMonitorsAndSummaryByTeamId(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_GET_BY_USER_ID(req.params.teamId),
				data: data,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - getMonitorsByTeamId", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {
				teamId: "123",
			},
			query: {},
			body: {},
			db: {
				getMonitorsByTeamId: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await getMonitorsByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if query validation fails", async function () {
		req.query = { invalid: 1 };
		await getMonitorsByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getMonitorsByTeamId.throws(new Error("DB error"));
		await getMonitorsByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message and data if all operations succeed", async function () {
		const data = { monitors: "data" };
		req.db.getMonitorsByTeamId.returns(data);
		await getMonitorsByTeamId(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_GET_BY_USER_ID(req.params.teamId),
				data: data,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - createMonitor", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {},
			query: {},
			body: {
				userId: "123",
				teamId: "123",
				name: "test_monitor",
				description: "test_monitor_desc",
				type: "http",
				url: "https://example.com",
				notifications: [{ email: "example@example.com" }],
			},
			db: {
				createMonitor: sinon.stub(),
				createNotification: sinon.stub(),
			},
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

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if body validation fails", async function () {
		req.body = {};
		await createMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB createMonitor operation fail", async function () {
		req.db.createMonitor.throws(new Error("DB error"));
		await createMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if DB createNotification operation fail", async function () {
		req.db.createNotification.throws(new Error("DB error"));
		req.db.createMonitor.returns({ _id: "123" });
		await createMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if monitor.save operation fail", async function () {
		req.db.createMonitor.returns({
			_id: "123",
			save: sinon.stub().throws(new Error("Monitor save error")),
		});
		await createMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Monitor save error");
	});

	it("should throw an error if addJob operation fails", async function () {
		req.db.createMonitor.returns({ _id: "123", save: sinon.stub() });
		req.jobQueue.addJob.throws(new Error("Job error"));
		await createMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Job error");
	});

	it("should return success message and data if all operations succeed", async function () {
		const monitor = { _id: "123", save: sinon.stub() };
		req.db.createMonitor.returns(monitor);
		await createMonitor(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(201);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_CREATE,
				data: monitor,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - checkEndpointResolution", function () {
	let req, res, next, axiosGetStub;

	beforeEach(function () {
		req = { query: { monitorURL: "https://example.com" } };
		res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
		next = sinon.stub();
		axiosGetStub = sinon.stub(axios, "get");
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should resolve the URL successfully", async function () {
		axiosGetStub.resolves({ status: 200, statusText: "OK" });
		await checkEndpointResolution(req, res, next);
		expect(res.status.calledWith(200)).to.be.true;
		expect(
			res.json.calledWith({
				success: true,
				code: 200,
				statusText: "OK",
				msg: "URL resolved successfully",
			})
		).to.be.true;
		expect(next.called).to.be.false;
	});

	it("should return an error if endpoint resolution fails", async function () {
		const axiosError = new Error("resolution failed");
		axiosError.code = "ENOTFOUND";
		axiosGetStub.rejects(axiosError);
		await checkEndpointResolution(req, res, next);
		expect(next.calledOnce).to.be.true;
		const errorPassedToNext = next.getCall(0).args[0];
		expect(errorPassedToNext).to.be.an.instanceOf(Error);
		expect(errorPassedToNext.message).to.include("resolution failed");
		expect(errorPassedToNext.code).to.equal("ENOTFOUND");
		expect(errorPassedToNext.status).to.equal(500);
	});

	it("should reject with an error if query validation fails", async function () {
		req.query.monitorURL = "invalid-url";
		await checkEndpointResolution(req, res, next);
		expect(next.calledOnce).to.be.true;
		const error = next.getCall(0).args[0];
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
		expect(error.message).to.equal('"monitorURL" must be a valid uri');
	});
});

describe("Monitor Controller - deleteMonitor", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {
				monitorId: "123",
			},
			query: {},
			body: {},
			db: {
				deleteMonitor: sinon.stub(),
				deleteChecks: sinon.stub(),
				deletePageSpeedChecksByMonitorId: sinon.stub(),
				deleteNotificationsByMonitorId: sinon.stub(),
			},
			jobQueue: {
				deleteJob: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
		sinon.stub(logger, "error");
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await deleteMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB deleteMonitor operation fail", async function () {
		req.db.deleteMonitor.throws(new Error("DB error"));
		await deleteMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should log an error if deleteJob throws an error", async function () {
		const error = new Error("Job error");
		const monitor = { name: "test_monitor", _id: "123" };
		req.db.deleteMonitor.returns(monitor);
		req.jobQueue.deleteJob.rejects(error);
		await deleteMonitor(req, res, next);
		expect(logger.error.calledOnce).to.be.true;
		expect(logger.error.firstCall.args[0].message).to.equal(
			`Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`
		);
	});

	it("should log an error if deleteChecks throws an error", async function () {
		const error = new Error("Checks error");
		const monitor = { name: "test_monitor", _id: "123" };
		req.db.deleteMonitor.returns(monitor);
		req.db.deleteChecks.rejects(error);
		await deleteMonitor(req, res, next);
		expect(logger.error.calledOnce).to.be.true;
		expect(logger.error.firstCall.args[0].message).to.equal(
			`Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`
		);
	});

	it("should log an error if deletePageSpeedChecksByMonitorId throws an error", async function () {
		const error = new Error("PageSpeed error");
		const monitor = { name: "test_monitor", _id: "123" };
		req.db.deleteMonitor.returns(monitor);
		req.db.deletePageSpeedChecksByMonitorId.rejects(error);
		await deleteMonitor(req, res, next);
		expect(logger.error.calledOnce).to.be.true;
		expect(logger.error.firstCall.args[0].message).to.equal(
			`Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`
		);
	});

	it("should log an error if deleteNotificationsByMonitorId throws an error", async function () {
		const error = new Error("Notifications error");
		const monitor = { name: "test_monitor", _id: "123" };
		req.db.deleteMonitor.returns(monitor);
		req.db.deleteNotificationsByMonitorId.rejects(error);
		await deleteMonitor(req, res, next);
		expect(logger.error.calledOnce).to.be.true;
		expect(logger.error.firstCall.args[0].message).to.equal(
			`Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`
		);
	});

	it("should return success message if all operations succeed", async function () {
		const monitor = { name: "test_monitor", _id: "123" };
		req.db.deleteMonitor.returns(monitor);
		await deleteMonitor(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_DELETE,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - deleteAllMonitors", function () {
	let req, res, next, stub;

	beforeEach(function () {
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { teamId: "123" };
		});
		req = {
			headers: {
				authorization: "Bearer token",
			},
			params: {
				monitorId: "123",
			},
			query: {},
			body: {},
			db: {
				deleteAllMonitors: sinon.stub(),
				deleteChecks: sinon.stub(),
				deletePageSpeedChecksByMonitorId: sinon.stub(),
				deleteNotificationsByMonitorId: sinon.stub(),
			},
			jobQueue: {
				deleteJob: sinon.stub(),
			},
			settingsService: {
				getSettings: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
		sinon.stub(logger, "error");
	});

	afterEach(function () {
		sinon.restore();
		stub.restore();
	});

	it("should reject with an error if getTokenFromHeaders throws an error", async function () {
		req.headers = {};
		await deleteAllMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("No auth headers");
		expect(next.firstCall.args[0].status).to.equal(500);
	});

	it("should reject with an error if token validation fails", async function () {
		stub.restore();
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		await deleteAllMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.instanceOf(jwt.JsonWebTokenError);
	});

	it("should reject with an error if DB deleteAllMonitors operation fail", async function () {
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.deleteAllMonitors.throws(new Error("DB error"));
		await deleteAllMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should log an error if deleteChecks throws an error", async function () {
		const monitors = [{ name: "test_monitor", _id: "123" }];
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.deleteAllMonitors.returns({ monitors, deletedCount: 1 });
		const error = new Error("Check error");
		req.db.deleteChecks.rejects(error);
		await deleteAllMonitors(req, res, next);
		expect(logger.error.calledOnce).to.be.true;
		expect(logger.error.firstCall.args[0].message).to.equal(
			`Error deleting associated records for monitor ${monitors[0]._id} with name ${monitors[0].name}`
		);
	});

	it("should log an error if deletePageSpeedChecksByMonitorId throws an error", async function () {
		const monitors = [{ name: "test_monitor", _id: "123" }];
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.deleteAllMonitors.returns({ monitors, deletedCount: 1 });
		const error = new Error("Pagespeed Check error");
		req.db.deletePageSpeedChecksByMonitorId.rejects(error);
		await deleteAllMonitors(req, res, next);
		expect(logger.error.calledOnce).to.be.true;
		expect(logger.error.firstCall.args[0].message).to.equal(
			`Error deleting associated records for monitor ${monitors[0]._id} with name ${monitors[0].name}`
		);
	});

	it("should log an error if deleteNotificationsByMonitorId throws an error", async function () {
		const monitors = [{ name: "test_monitor", _id: "123" }];
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.deleteAllMonitors.returns({ monitors, deletedCount: 1 });
		const error = new Error("Notifications Check error");
		req.db.deleteNotificationsByMonitorId.rejects(error);
		await deleteAllMonitors(req, res, next);
		expect(logger.error.calledOnce).to.be.true;
		expect(logger.error.firstCall.args[0].message).to.equal(
			`Error deleting associated records for monitor ${monitors[0]._id} with name ${monitors[0].name}`
		);
	});

	it("should return success message if all operations succeed", async function () {
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.deleteAllMonitors.returns({
			monitors: [{ name: "test_monitor", _id: "123" }],
			deletedCount: 1,
		});
		await deleteAllMonitors(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: "Deleted 1 monitors",
			})
		).to.be.true;
	});
});

describe("Monitor Controller - editMonitor", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {
				monitorId: "123",
			},
			query: {},
			body: {
				notifications: [{ email: "example@example.com" }],
			},
			db: {
				getMonitorById: sinon.stub(),
				editMonitor: sinon.stub(),
				deleteNotificationsByMonitorId: sinon.stub(),
				createNotification: sinon.stub(),
			},
			jobQueue: {
				deleteJob: sinon.stub(),
				addJob: sinon.stub(),
			},
			settingsService: {
				getSettings: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if body validation fails", async function () {
		req.body = { invalid: 1 };
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if getMonitorById operation fails", async function () {
		req.db.getMonitorById.throws(new Error("DB error"));
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if editMonitor operation fails", async function () {
		req.db.getMonitorById.returns({ teamId: "123" });
		req.db.editMonitor.throws(new Error("DB error"));
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if deleteNotificationsByMonitorId operation fails", async function () {
		req.db.getMonitorById.returns({ teamId: "123" });
		req.db.editMonitor.returns({ _id: "123" });
		req.db.deleteNotificationsByMonitorId.throws(new Error("DB error"));
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if createNotification operation fails", async function () {
		req.db.getMonitorById.returns({ teamId: "123" });
		req.db.editMonitor.returns({ _id: "123" });
		req.db.createNotification.throws(new Error("DB error"));
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if deleteJob operation fails", async function () {
		req.db.getMonitorById.returns({ teamId: "123" });
		req.db.editMonitor.returns({ _id: "123" });
		req.jobQueue.deleteJob.throws(new Error("Job error"));
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Job error");
	});

	it("should reject with an error if addJob operation fails", async function () {
		req.db.getMonitorById.returns({ teamId: "123" });
		req.db.editMonitor.returns({ _id: "123" });
		req.jobQueue.addJob.throws(new Error("Add Job error"));
		await editMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Add Job error");
	});

	it("should return success message with data if all operations succeed", async function () {
		const monitor = { _id: "123" };
		req.db.getMonitorById.returns({ teamId: "123" });
		req.db.editMonitor.returns(monitor);
		await editMonitor(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_EDIT,
				data: monitor,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - pauseMonitor", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {
				monitorId: "123",
			},
			query: {},
			body: {},
			db: {
				getMonitorById: sinon.stub(),
			},
			jobQueue: {
				deleteJob: sinon.stub(),
				addJob: sinon.stub(),
			},
			settingsService: {
				getSettings: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	afterEach(function () {
		sinon.restore();
	});

	it("should reject with an error if param validation fails", async function () {
		req.params = {};
		await pauseMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if getMonitorById operation fails", async function () {
		req.db.getMonitorById.throws(new Error("DB error"));
		await pauseMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if deleteJob operation fails", async function () {
		const monitor = { _id: req.params.monitorId, isActive: true };
		req.db.getMonitorById.returns(monitor);
		req.jobQueue.deleteJob.throws(new Error("Delete Job error"));
		await pauseMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Delete Job error");
	});

	it("should reject with an error if addJob operation fails", async function () {
		const monitor = { _id: req.params.monitorId, isActive: false };
		req.db.getMonitorById.returns(monitor);
		req.jobQueue.addJob.throws(new Error("Add Job error"));
		await pauseMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Add Job error");
	});

	it("should reject with an error if monitor.save operation fails", async function () {
		const monitor = {
			_id: req.params.monitorId,
			active: false,
			save: sinon.stub().throws(new Error("Save error")),
		};
		req.db.getMonitorById.returns(monitor);
		await pauseMonitor(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Save error");
	});

	it("should return success pause message with data if all operations succeed with inactive monitor", async function () {
		const monitor = {
			_id: req.params.monitorId,
			isActive: false,
			save: sinon.stub().resolves(),
		};
		req.db.getMonitorById.returns(monitor);
		await pauseMonitor(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_PAUSE,
				data: monitor,
			})
		).to.be.true;
	});

	it("should return success resume message with data if all operations succeed with active monitor", async function () {
		const monitor = {
			_id: req.params.monitorId,
			isActive: true,
			save: sinon.stub().resolves(),
		};
		req.db.getMonitorById.returns(monitor);
		await pauseMonitor(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_RESUME,
				data: monitor,
			})
		).to.be.true;
	});
});

describe("Monitor Controller - addDemoMonitors", function () {
	let req, res, next, stub;

	beforeEach(function () {
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { _id: "123", teamId: "123" };
		});
		req = {
			headers: {
				authorization: "Bearer token",
			},
			params: {},
			query: {},
			body: {},
			db: {
				addDemoMonitors: sinon.stub(),
			},
			settingsService: {
				getSettings: sinon.stub(),
			},
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

	afterEach(function () {
		sinon.restore();
		stub.restore();
	});

	it("should reject with an error if getTokenFromHeaders fails", async function () {
		req.headers = {};
		await addDemoMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("No auth headers");
		expect(next.firstCall.args[0].status).to.equal(500);
	});

	it("should reject with an error if getting settings fails", async function () {
		req.settingsService.getSettings.throws(new Error("Settings error"));
		await addDemoMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Settings error");
	});

	it("should reject with an error if JWT validation fails", async function () {
		stub.restore();
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		await addDemoMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.instanceOf(jwt.JsonWebTokenError);
	});

	it("should reject with an error if addDemoMonitors operation fails", async function () {
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.addDemoMonitors.throws(new Error("DB error"));
		await addDemoMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should reject with an error if addJob operation fails", async function () {
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.addDemoMonitors.returns([{ _id: "123" }]);
		req.jobQueue.addJob.throws(new Error("Add Job error"));
		await addDemoMonitors(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("Add Job error");
	});

	it("should return success message with data if all operations succeed", async function () {
		const monitors = [{ _id: "123" }];
		req.settingsService.getSettings.returns({ jwtSecret: "my_secret" });
		req.db.addDemoMonitors.returns(monitors);
		await addDemoMonitors(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MONITOR_DEMO_ADDED,
				data: monitors.length,
			})
		).to.be.true;
	});
});
