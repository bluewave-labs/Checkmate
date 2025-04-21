import {
	createMaintenanceWindows,
	getMaintenanceWindowById,
	getMaintenanceWindowsByTeamId,
	getMaintenanceWindowsByMonitorId,
	deleteMaintenanceWindow,
	editMaintenanceWindow,
} from "../../controllers/maintenanceWindowController.js";

import jwt from "jsonwebtoken";
import { successMessages } from "../../utils/messages.js";
import sinon from "sinon";

describe("maintenanceWindowController - createMaintenanceWindows", function () {
	let req, res, next, stub;

	beforeEach(function () {
		req = {
			body: {
				monitors: ["66ff52e7c5911c61698ac724"],
				name: "window",
				active: true,
				start: "2024-10-11T05:27:13.747Z",
				end: "2024-10-11T05:27:14.747Z",
				repeat: "123",
			},
			headers: {
				authorization: "Bearer token",
			},
			settingsService: {
				getSettings: sinon.stub().returns({ jwtSecret: "jwtSecret" }),
			},
			db: {
				createMaintenanceWindow: sinon.stub(),
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
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { teamId: "123" };
		});
		req.body = {};
		await createMaintenanceWindows(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
		stub.restore();
	});

	it("should reject with an error if jwt.verify fails", async function () {
		stub = sinon.stub(jwt, "verify").throws(new jwt.JsonWebTokenError());
		await createMaintenanceWindows(req, res, next);
		expect(next.firstCall.args[0]).to.be.instanceOf(jwt.JsonWebTokenError);
		stub.restore();
	});

	it("should reject with an error DB operations fail", async function () {
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { teamId: "123" };
		});
		req.db.createMaintenanceWindow.throws(new Error("DB error"));
		await createMaintenanceWindows(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
		stub.restore();
	});

	it("should return success message if all operations are successful", async function () {
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { teamId: "123" };
		});
		await createMaintenanceWindows(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(201);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MAINTENANCE_WINDOW_CREATE,
			})
		).to.be.true;
		stub.restore();
	});

	it("should return success message if all operations are successful with active set to undefined", async function () {
		req.body.active = undefined;
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { teamId: "123" };
		});
		await createMaintenanceWindows(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(201);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MAINTENANCE_WINDOW_CREATE,
			})
		).to.be.true;
		stub.restore();
	});
});

describe("maintenanceWindowController - getMaintenanceWindowById", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			body: {},
			params: {
				id: "123",
			},
			headers: {
				authorization: "Bearer token",
			},
			settingsService: {
				getSettings: sinon.stub().returns({ jwtSecret: "jwtSecret" }),
			},
			db: {
				getMaintenanceWindowById: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	it("should reject if param validation fails", async function () {
		req.params = {};
		await getMaintenanceWindowById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject if DB operations fail", async function () {
		req.db.getMaintenanceWindowById.throws(new Error("DB error"));
		await getMaintenanceWindowById(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message with data if all operations are successful", async function () {
		req.db.getMaintenanceWindowById.returns({ id: "123" });
		await getMaintenanceWindowById(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MAINTENANCE_WINDOW_GET_BY_ID,
				data: { id: "123" },
			})
		).to.be.true;
	});
});

describe("maintenanceWindowController - getMaintenanceWindowsByTeamId", function () {
	let req, res, next, stub;

	beforeEach(function () {
		req = {
			body: {},
			params: {},
			query: {},
			headers: {
				authorization: "Bearer token",
			},
			settingsService: {
				getSettings: sinon.stub().returns({ jwtSecret: "jwtSecret" }),
			},
			db: {
				getMaintenanceWindowsByTeamId: sinon.stub(),
			},
		};
		res = {
			status: sinon.stub().returnsThis(),
			json: sinon.stub(),
		};
		next = sinon.stub();
	});

	it("should reject if query validation fails", async function () {
		req.query = {
			invalid: 1,
		};
		await getMaintenanceWindowsByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject if jwt.verify fails", async function () {
		stub = sinon.stub(jwt, "verify").throws(new jwt.JsonWebTokenError());
		await getMaintenanceWindowsByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.instanceOf(jwt.JsonWebTokenError);
		stub.restore();
	});

	it("should reject with an error if DB operations fail", async function () {
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { teamId: "123" };
		});
		req.db.getMaintenanceWindowsByTeamId.throws(new Error("DB error"));
		await getMaintenanceWindowsByTeamId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
		stub.restore();
	});

	it("should return success message with data if all operations are successful", async function () {
		stub = sinon.stub(jwt, "verify").callsFake(() => {
			return { teamId: "123" };
		});
		req.db.getMaintenanceWindowsByTeamId.returns([{ id: "123" }]);
		await getMaintenanceWindowsByTeamId(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MAINTENANCE_WINDOW_GET_BY_TEAM,
				data: [{ id: jwt.verify().teamId }],
			})
		).to.be.true;
		stub.restore();
	});
});

describe("maintenanceWindowController - getMaintenanceWindowsByMonitorId", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			body: {},
			params: {
				monitorId: "123",
			},
			query: {},
			headers: {
				authorization: "Bearer token",
			},
			settingsService: {
				getSettings: sinon.stub().returns({ jwtSecret: "jwtSecret" }),
			},
			db: {
				getMaintenanceWindowsByMonitorId: sinon.stub(),
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

	it("should reject if param validation fails", async function () {
		req.params = {};
		await getMaintenanceWindowsByMonitorId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getMaintenanceWindowsByMonitorId.throws(new Error("DB error"));
		await getMaintenanceWindowsByMonitorId(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message with data if all operations are successful", async function () {
		const data = [{ monitorId: "123" }];
		req.db.getMaintenanceWindowsByMonitorId.returns(data);
		await getMaintenanceWindowsByMonitorId(req, res, next);
		expect(req.db.getMaintenanceWindowsByMonitorId.calledOnceWith(req.params.monitorId));
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MAINTENANCE_WINDOW_GET_BY_MONITOR,
				data: data,
			})
		).to.be.true;
	});
});

describe("maintenanceWindowController - deleteMaintenanceWindow", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			body: {},
			params: {
				id: "123",
			},
			query: {},
			headers: {
				authorization: "Bearer token",
			},
			settingsService: {
				getSettings: sinon.stub().returns({ jwtSecret: "jwtSecret" }),
			},
			db: {
				deleteMaintenanceWindowById: sinon.stub(),
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

	it("should reject if param validation fails", async function () {
		req.params = {};
		await deleteMaintenanceWindow(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.deleteMaintenanceWindowById.throws(new Error("DB error"));
		await deleteMaintenanceWindow(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message if all operations are successful", async function () {
		await deleteMaintenanceWindow(req, res, next);
		expect(req.db.deleteMaintenanceWindowById.calledOnceWith(req.params.id));
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MAINTENANCE_WINDOW_DELETE,
			})
		).to.be.true;
	});
});

describe("maintenanceWindowController - editMaintenanceWindow", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			body: {
				active: true,
				name: "test",
			},
			params: {
				id: "123",
			},
			query: {},
			headers: {
				authorization: "Bearer token",
			},
			settingsService: {
				getSettings: sinon.stub().returns({ jwtSecret: "jwtSecret" }),
			},
			db: {
				editMaintenanceWindowById: sinon.stub(),
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

	it("should reject if param validation fails", async function () {
		req.params = {};
		await editMaintenanceWindow(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject if body validation fails", async function () {
		req.body = { invalid: 1 };
		await editMaintenanceWindow(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.editMaintenanceWindowById.throws(new Error("DB error"));
		await editMaintenanceWindow(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return success message with data if all operations are successful", async function () {
		const data = { id: "123" };
		req.db.editMaintenanceWindowById.returns(data);

		await editMaintenanceWindow(req, res, next);
		expect(req.db.editMaintenanceWindowById.calledOnceWith(req.params.id, req.body));
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(
			res.json.calledOnceWith({
				success: true,
				msg: successMessages.MAINTENANCE_WINDOW_EDIT,
				data: data,
			})
		).to.be.true;
	});
});
