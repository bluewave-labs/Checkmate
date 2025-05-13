import { afterEach } from "node:test";
import {
	getAppSettings,
	updateAppSettings,
} from "../../controllers/settingsController.js";

import { successMessages } from "../../utils/messages.js";
import sinon from "sinon";

describe("Settings Controller - getAppSettings", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {},
			body: {},
			db: {},
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

	afterEach(() => {
		sinon.restore();
	});

	it("should throw an error if getSettings throws an error", async function () {
		req.settingsService.getSettings.throws(new Error("getSettings error"));
		await getAppSettings(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("getSettings error");
	});

	it("should return a success message and data if getSettings is successful", async function () {
		const data = { data: "settings" };
		req.settingsService.getSettings.returns(data);
		await getAppSettings(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(res.json.firstCall.args[0]).to.deep.equal({
			success: true,
			msg: successMessages.GET_APP_SETTINGS,
			data,
		});
	});
});

describe("Settings Controller - updateAppSettings", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			headers: {},
			params: {},
			body: {},
			db: {
				updateAppSettings: sinon.stub(),
			},
			settingsService: {
				reloadSettings: sinon.stub(),
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

	it("should reject with an error if body validation fails", async function () {
		req.body = { invalid: 1 };
		await updateAppSettings(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if updateAppSettings throws an error", async function () {
		req.db.updateAppSettings.throws(new Error("updateAppSettings error"));
		await updateAppSettings(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("updateAppSettings error");
	});

	it("should reject with an error if reloadSettings throws an error", async function () {
		req.settingsService.reloadSettings.throws(new Error("reloadSettings error"));
		await updateAppSettings(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("reloadSettings error");
	});

	it("should return a success message and data if updateAppSettings is successful", async function () {
		const data = { data: "settings" };
		req.settingsService.reloadSettings.returns(data);
		await updateAppSettings(req, res, next);
		expect(res.status.firstCall.args[0]).to.equal(200);
		expect(res.json.firstCall.args[0]).to.deep.equal({
			success: true,
			msg: successMessages.UPDATE_APP_SETTINGS,
			data,
		});
	});
});
