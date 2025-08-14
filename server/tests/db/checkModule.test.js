import sinon from "sinon";
import {
	createCheck,
	getChecksCount,
	getChecks,
	getTeamChecks,
	deleteChecks,
	deleteChecksByTeamId,
	updateChecksTTL,
} from "../../db/mongo/modules/checkModule.js";
import Check from "../../db/models/Check.js";
import Monitor from "../../db/models/Monitor.js";
import User from "../../db/models/User.js";
import logger from "../../utils/logger.js";

describe("checkModule", function () {
	describe("createCheck", function () {
		let checkCountDocumentsStub, checkSaveStub, monitorFindByIdStub, monitorSaveStub;
		const mockMonitor = {
			_id: "123",
			uptimePercentage: 0.5,
			status: true,
			save: () => this,
		};
		const mockCheck = { active: true };

		beforeEach(function () {
			checkSaveStub = sinon.stub(Check.prototype, "save");
			checkCountDocumentsStub = sinon.stub(Check, "countDocuments");
			monitorFindByIdStub = sinon.stub(Monitor, "findById");
			monitorSaveStub = sinon.stub(Monitor.prototype, "save");
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return undefined early if no monitor is found", async function () {
			monitorFindByIdStub.returns(null);
			const check = await createCheck({ monitorId: "123" });
			expect(check).to.be.undefined;
		});

		it("should return a check", async function () {
			monitorFindByIdStub.returns(mockMonitor);
			checkSaveStub.returns(mockCheck);
			monitorSaveStub.returns(mockMonitor);
			const check = await createCheck({ monitorId: "123", status: true });
			expect(check).to.deep.equal(mockCheck);
		});

		it("should return a check if status is down", async function () {
			mockMonitor.status = false;
			monitorFindByIdStub.returns(mockMonitor);
			checkSaveStub.returns(mockCheck);
			monitorSaveStub.returns(mockMonitor);
			const check = await createCheck({ monitorId: "123", status: false });
			expect(check).to.deep.equal(mockCheck);
		});

		it("should return a check if uptimePercentage is undefined", async function () {
			mockMonitor.uptimePercentage = undefined;
			monitorFindByIdStub.returns(mockMonitor);
			checkSaveStub.returns(mockCheck);
			monitorSaveStub.returns(mockMonitor);
			const check = await createCheck({ monitorId: "123", status: true });
			expect(check).to.deep.equal(mockCheck);
		});

		it("should return a check if uptimePercentage is undefined and status is down", async function () {
			mockMonitor.uptimePercentage = undefined;
			monitorFindByIdStub.returns(mockMonitor);
			checkSaveStub.returns(mockCheck);
			monitorSaveStub.returns(mockMonitor);
			const check = await createCheck({ monitorId: "123", status: false });
			expect(check).to.deep.equal(mockCheck);
		});

		it("should monitor save error", async function () {
			const err = new Error("Save Error");
			monitorSaveStub.throws(err);
			try {
				await createCheck({ monitorId: "123" });
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});

		it("should handle errors", async function () {
			const err = new Error("DB Error");
			checkCountDocumentsStub.throws(err);
			try {
				await createCheck({ monitorId: "123" });
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("getChecksCount", function () {
		let checkCountDocumentStub;

		beforeEach(function () {
			checkCountDocumentStub = sinon.stub(Check, "countDocuments");
		});

		afterEach(function () {
			checkCountDocumentStub.restore();
		});

		it("should return count with basic monitorId query", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: {},
			};
			checkCountDocumentStub.resolves(5);

			const result = await getChecksCount(req);

			expect(result).to.equal(5);
			expect(checkCountDocumentStub.calledOnce).to.be.true;
			expect(checkCountDocumentStub.firstCall.args[0]).to.deep.equal({
				monitorId: "test123",
			});
		});

		it("should include dateRange in query when provided", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { dateRange: "day" },
			};
			checkCountDocumentStub.resolves(3);

			const result = await getChecksCount(req);

			expect(result).to.equal(3);
			expect(checkCountDocumentStub.firstCall.args[0]).to.have.property("createdAt");
			expect(checkCountDocumentStub.firstCall.args[0].createdAt).to.have.property("$gte");
		});

		it('should handle "all" filter correctly', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "all" },
			};
			checkCountDocumentStub.resolves(2);

			const result = await getChecksCount(req);

			expect(result).to.equal(2);
			expect(checkCountDocumentStub.firstCall.args[0]).to.deep.equal({
				monitorId: "test123",
				status: false,
			});
		});

		it('should handle "down" filter correctly', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "down" },
			};
			checkCountDocumentStub.resolves(2);

			const result = await getChecksCount(req);

			expect(result).to.equal(2);
			expect(checkCountDocumentStub.firstCall.args[0]).to.deep.equal({
				monitorId: "test123",
				status: false,
			});
		});

		it('should handle "resolve" filter correctly', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "resolve" },
			};
			checkCountDocumentStub.resolves(1);

			const result = await getChecksCount(req);

			expect(result).to.equal(1);
			expect(checkCountDocumentStub.firstCall.args[0]).to.deep.equal({
				monitorId: "test123",
				status: false,
				statusCode: 5000,
			});
		});

		it("should handle unknown filter correctly", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "unknown" },
			};
			checkCountDocumentStub.resolves(1);

			const result = await getChecksCount(req);

			expect(result).to.equal(1);
			expect(checkCountDocumentStub.firstCall.args[0]).to.deep.equal({
				monitorId: "test123",
				status: false,
			});
		});

		it("should combine dateRange and filter in query", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: {
					dateRange: "week",
					filter: "down",
				},
			};
			checkCountDocumentStub.resolves(4);

			const result = await getChecksCount(req);

			expect(result).to.equal(4);
			expect(checkCountDocumentStub.firstCall.args[0]).to.have.all.keys("monitorId", "createdAt", "status");
		});
	});

	describe("getChecks", function () {
		let checkFindStub, monitorFindStub;

		beforeEach(function () {
			checkFindStub = sinon.stub(Check, "find").returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns([{ id: 1 }, { id: 2 }]),
					}),
				}),
			});
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return checks with basic monitorId query", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: {},
			};

			const result = await getChecks(req);

			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it("should return checks with limit query", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { limit: 10 },
			};

			const result = await getChecks(req);

			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it("should handle pagination correctly", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: {
					page: 2,
					rowsPerPage: 10,
				},
			};

			const result = await getChecks(req);

			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it("should handle dateRange filter", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { dateRange: "week" },
			};
			const result = await getChecks(req);

			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it('should handle "all" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "all" },
			};

			await getChecks(req);
			const result = await getChecks(req);
			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it('should handle "down" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "down" },
			};

			await getChecks(req);
			const result = await getChecks(req);
			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it('should handle "resolve" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "resolve" },
			};

			await getChecks(req);
			const result = await getChecks(req);
			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it('should handle "unknown" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "unknown" },
			};

			await getChecks(req);
			const result = await getChecks(req);
			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it("should handle ascending sort order", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { sortOrder: "asc" },
			};

			await getChecks(req);
			const result = await getChecks(req);
			expect(result).to.deep.equal([{ id: 1 }, { id: 2 }]);
		});

		it("should handle error case", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: {},
			};

			checkFindStub.throws(new Error("Database error"));

			try {
				await getChecks(req);
			} catch (error) {
				expect(error.message).to.equal("Database error");
				expect(error.service).to.equal("checkModule");
				expect(error.method).to.equal("getChecks");
			}
		});
	});

	describe("getTeamChecks", function () {
		let checkFindStub, checkCountDocumentsStub, monitorFindStub;
		const mockMonitors = [{ _id: "123" }];

		beforeEach(function () {
			monitorFindStub = sinon.stub(Monitor, "find").returns({
				select: sinon.stub().returns(mockMonitors),
			});
			checkCountDocumentsStub = sinon.stub(Check, "countDocuments").returns(2);
			checkFindStub = sinon.stub(Check, "find").returns({
				skip: sinon.stub().returns({
					limit: sinon.stub().returns({
						sort: sinon.stub().returns({
							select: sinon.stub().returns([{ id: 1 }, { id: 2 }]),
						}),
					}),
				}),
			});
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return checks with basic monitorId query", async function () {
			const req = {
				params: { teamId: "test123" },
				query: {},
			};

			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it("should handle pagination correctly", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { limit: 1, page: 2, rowsPerPage: 10 },
			};

			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it("should handle dateRange filter", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { dateRange: "week" },
			};
			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it('should handle "all" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "all" },
			};

			await getChecks(req);
			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it('should handle "down" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "down" },
			};

			await getChecks(req);
			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it('should handle "resolve" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "resolve" },
			};

			await getChecks(req);
			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it('should handle "unknown" filter', async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { filter: "unknown" },
			};

			await getChecks(req);
			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it("should handle ascending sort order", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: { sortOrder: "asc" },
			};

			await getChecks(req);
			const result = await getTeamChecks(req);
			expect(result).to.deep.equal({ checksCount: 2, checks: [{ id: 1 }, { id: 2 }] });
		});

		it("should handle error case", async function () {
			const req = {
				params: { monitorId: "test123" },
				query: {},
			};

			checkFindStub.throws(new Error("Database error"));

			try {
				await getTeamChecks(req);
			} catch (error) {
				expect(error.message).to.equal("Database error");
				expect(error.service).to.equal("checkModule");
				expect(error.method).to.equal("getTeamChecks");
			}
		});
	});

	describe("deleteChecks", function () {
		let checkDeleteManyStub;

		beforeEach(function () {
			checkDeleteManyStub = sinon.stub(Check, "deleteMany").resolves({ deletedCount: 1 });
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return a value if a check is deleted", async function () {
			const result = await deleteChecks("123");
			expect(result).to.equal(1);
		});

		it("should handle an error", async function () {
			checkDeleteManyStub.throws(new Error("Database error"));
			try {
				await deleteChecks("123");
			} catch (error) {
				expect(error.message).to.equal("Database error");
				expect(error.method).to.equal("deleteChecks");
			}
		});
	});

	describe("deleteChecksByTeamId", function () {
		let mockMonitors = [{ _id: 123, save: () => this }];
		let monitorFindStub, monitorSaveStub, checkDeleteManyStub;

		beforeEach(function () {
			monitorSaveStub = sinon.stub(Monitor.prototype, "save");
			monitorFindStub = sinon.stub(Monitor, "find").returns(mockMonitors);
			checkDeleteManyStub = sinon.stub(Check, "deleteMany").resolves({ deletedCount: 1 });
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return a deleted count", async function () {
			const result = await deleteChecksByTeamId("123");
			expect(result).to.equal(1);
		});

		it("should handle errors", async function () {
			const err = new Error("DB Error");
			monitorFindStub.throws(err);
			try {
				const result = await deleteChecksByTeamId("123");
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("updateChecksTTL", function () {
		let userUpdateManyStub;
		let loggerStub;

		beforeEach(function () {
			loggerStub = sinon.stub(logger, "error");
			userUpdateManyStub = sinon.stub(User, "updateMany");
			Check.collection = { dropIndex: sinon.stub(), createIndex: sinon.stub() };
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return undefined", async function () {
			const result = await updateChecksTTL("123", 10);
			expect(result).to.be.undefined;
		});

		it("should log an error if dropIndex throws an error", async function () {
			const err = new Error("Drop Index Error");
			Check.collection.dropIndex.throws(err);
			await updateChecksTTL("123", 10);
			expect(loggerStub.calledOnce).to.be.true;
			expect(loggerStub.firstCall.args[0].message).to.equal(err.message);
		});

		it("should throw an error if createIndex throws an error", async function () {
			const err = new Error("Create Index Error");
			Check.collection.createIndex.throws(err);
			try {
				await updateChecksTTL("123", 10);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});

		it("should throw an error if User.updateMany throws an error", async function () {
			const err = new Error("Update Many Error");
			userUpdateManyStub.throws(err);
			try {
				await updateChecksTTL("123", 10);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});
});
