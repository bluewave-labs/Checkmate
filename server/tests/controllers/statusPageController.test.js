import sinon from "sinon";
import {
	createStatusPage,
	getStatusPageByUrl,
} from "../../controllers/statusPageController.js";

describe("statusPageController", function () {
	let req, res, next;

	beforeEach(function () {
		req = {
			params: {},
			body: {},
			db: {
				createStatusPage: sinon.stub(),
				getStatusPageByUrl: sinon.stub(),
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

	describe("createStatusPage", function () {
		beforeEach(function () {
			req.body = {
				companyName: "Test Company",
				url: "123456",
				timezone: "America/Toronto",
				color: "#000000",
				theme: "light",
				monitors: ["67309ca673788e808884c8ac", "67309ca673788e808884c8ac"],
			};
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should handle a validation error", async function () {
			req.body = {
				// Invalid data that will trigger validation error
				companyName: "",
				url: "",
				timezone: "",
				color: "invalid",
				theme: "invalid",
				monitors: ["invalid-id"],
			};
			try {
				await createStatusPage(req, res, next);
			} catch (error) {
				expect(error).to.be.an.instanceOf(Error);
				expect(error.message).to.equal("Validation error");
			}
		});

		it("should handle a db error", async function () {
			const err = new Error("DB error");
			req.db.createStatusPage.throws(err);

			try {
				await createStatusPage(req, res, next);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});

		it("should insert a properly formatted status page", async function () {
			const result = await createStatusPage(req, res, next);
			expect(res.status.firstCall.args[0]).to.equal(200);
			expect(res.json.firstCall.args[0].success).to.be.true;
		});
	});

	describe("getStatusPageByUrl", function () {
		beforeEach(function () {
			req.params = {
				url: "123456",
			};
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should handle a validation error", async function () {
			req.params = {
				url: "",
			};

			try {
				await getStatusPageByUrl(req, res, next);
			} catch (error) {
				expect(error).to.be.an.instanceOf(Error);
				expect(error.message).to.equal("Validation error");
			}
		});

		it("should handle a DB error", async function () {
			const err = new Error("DB error");
			req.db.getStatusPageByUrl.throws(err);

			try {
				await getStatusPageByUrl(req, res, next);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});

		it("should return a status page", async function () {
			const statusPage = {
				_id: "123456",
				companyName: "Test Company",
				url: "123456",
			};
			req.db.getStatusPageByUrl.resolves(statusPage);
			const result = await getStatusPageByUrl(req, res, next);
			expect(res.status.firstCall.args[0]).to.equal(200);
			expect(res.json.firstCall.args[0].success).to.be.true;
			expect(res.json.firstCall.args[0].data).to.deep.equal(statusPage);
		});
	});
});
