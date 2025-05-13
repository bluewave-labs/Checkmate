import {
	issueInvitation,
	inviteVerifyController,
} from "../../controllers/inviteController.js";
import jwt from "jsonwebtoken";
import sinon from "sinon";
import joi from "joi";
describe("inviteController - issueInvitation", function () {
	let req, res, next, stub;

	beforeEach(function () {
		req = {
			headers: { authorization: "Bearer token" },
			body: {
				email: "test@test.com",
				role: ["admin"],
				teamId: "123",
			},
			db: { requestInviteToken: sinon.stub() },
			settingsService: { getSettings: sinon.stub() },
			emailService: { buildAndSendEmail: sinon.stub() },
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

	it("should reject with an error if role validation fails", async function () {
		stub = sinon.stub(jwt, "decode").callsFake(() => {
			return { role: ["bad_role"], firstname: "first_name", teamId: "1" };
		});
		await issueInvitation(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0]).to.be.instanceOf(joi.ValidationError);
		expect(next.firstCall.args[0].status).to.equal(422);
		stub.restore();
	});

	it("should reject with an error if body validation fails", async function () {
		stub = sinon.stub(jwt, "decode").callsFake(() => {
			return { role: ["admin"], firstname: "first_name", teamId: "1" };
		});
		req.body = {};
		await issueInvitation(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
		stub.restore();
	});

	it("should reject with an error if DB operations fail", async function () {
		stub = sinon.stub(jwt, "decode").callsFake(() => {
			return { role: ["admin"], firstname: "first_name", teamId: "1" };
		});
		req.db.requestInviteToken.throws(new Error("DB error"));
		await issueInvitation(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
		stub.restore();
	});

	it("should send an invite successfully", async function () {
		const token = "token";
		const decodedToken = {
			role: "admin",
			firstname: "John",
			teamId: "team123",
		};
		const inviteToken = { token: "inviteToken" };
		const clientHost = "http://localhost";

		stub = sinon.stub(jwt, "decode").callsFake(() => {
			return decodedToken;
		});
		req.db.requestInviteToken.resolves(inviteToken);
		req.settingsService.getSettings.returns({ clientHost });
		req.emailService.buildAndSendEmail.resolves();
		await issueInvitation(req, res, next);
		expect(res.status.calledWith(200)).to.be.true;
		expect(
			res.json.calledWith({
				success: true,
				msg: "Invite sent",
				data: inviteToken,
			})
		).to.be.true;
		stub.restore();
	});

	it("should send an email successfully", async function () {
		const token = "token";
		const decodedToken = {
			role: "admin",
			firstname: "John",
			teamId: "team123",
		};
		const inviteToken = { token: "inviteToken" };
		const clientHost = "http://localhost";

		stub = sinon.stub(jwt, "decode").callsFake(() => {
			return decodedToken;
		});
		req.db.requestInviteToken.resolves(inviteToken);
		req.settingsService.getSettings.returns({ clientHost });
		req.emailService.buildAndSendEmail.resolves();

		await issueInvitation(req, res, next);
		expect(req.emailService.buildAndSendEmail.calledOnce).to.be.true;
		expect(
			req.emailService.buildAndSendEmail.calledWith(
				"employeeActivationTemplate",
				{
					name: "John",
					link: "http://localhost/register/inviteToken",
				},
				"test@test.com",
				"Welcome to Uptime Monitor"
			)
		).to.be.true;
		stub.restore();
	});

	it("should continue executing if sending an email fails", async function () {
		const token = "token";
		req.emailService.buildAndSendEmail.rejects(new Error("Email error"));
		const decodedToken = {
			role: "admin",
			firstname: "John",
			teamId: "team123",
		};
		const inviteToken = { token: "inviteToken" };
		const clientHost = "http://localhost";

		stub = sinon.stub(jwt, "decode").callsFake(() => {
			return decodedToken;
		});
		req.db.requestInviteToken.resolves(inviteToken);
		req.settingsService.getSettings.returns({ clientHost });
		await issueInvitation(req, res, next);
		expect(res.status.calledWith(200)).to.be.true;
		expect(
			res.json.calledWith({
				success: true,
				msg: "Invite sent",
				data: inviteToken,
			})
		).to.be.true;
		stub.restore();
	});
});

describe("inviteController - inviteVerifyController", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			body: { token: "token" },
			db: {
				getInviteToken: sinon.stub(),
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
		await inviteVerifyController(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].status).to.equal(422);
	});

	it("should reject with an error if DB operations fail", async function () {
		req.db.getInviteToken.throws(new Error("DB error"));
		await inviteVerifyController(req, res, next);
		expect(next.firstCall.args[0]).to.be.an("error");
		expect(next.firstCall.args[0].message).to.equal("DB error");
	});

	it("should return 200 and invite data when validation and invite retrieval are successful", async function () {
		req.db.getInviteToken.resolves({ invite: "data" });
		await inviteVerifyController(req, res, next);
		expect(res.status.calledWith(200)).to.be.true;
		expect(
			res.json.calledWith({
				status: "success",
				msg: "Invite verified",
				data: { invite: "data" },
			})
		).to.be.true;
		expect(next.called).to.be.false;
	});
});
