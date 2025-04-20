import sinon from "sinon";
import MaintenanceWindow from "../../db/models/MaintenanceWindow.js";
import {
	createMaintenanceWindow,
	getMaintenanceWindowById,
	getMaintenanceWindowsByTeamId,
	getMaintenanceWindowsByMonitorId,
	deleteMaintenanceWindowById,
	deleteMaintenanceWindowByMonitorId,
	deleteMaintenanceWindowByUserId,
	editMaintenanceWindowById,
} from "../../db/mongo/modules/maintenanceWindowModule.js";

describe("MaintenanceWindow Module", function () {
	const mockMaintenanceWindow = {
		monitorId: "123",
		active: true,
		oneTime: true,
		start: 1,
		end: 20000,
	};

	let mockMaintenanceWindows = [mockMaintenanceWindow];
	let maintenanceWindowSaveStub,
		maintenanceWindowFindByIdStub,
		maintenanceWindowCountDocumentsStub,
		maintenanceWindowFindStub,
		maintenanceWindowFindByIdAndDeleteStub,
		maintenanceWindowDeleteManyStub,
		maintenanceWindowFindByIdAndUpdateStub;

	beforeEach(function () {
		maintenanceWindowSaveStub = sinon.stub(MaintenanceWindow.prototype, "save");
		maintenanceWindowFindByIdStub = sinon.stub(MaintenanceWindow, "findById");
		maintenanceWindowCountDocumentsStub = sinon.stub(MaintenanceWindow, "countDocuments");
		maintenanceWindowFindStub = sinon.stub(MaintenanceWindow, "find").returns({
			skip: sinon.stub().returns({
				limit: sinon.stub().returns({
					sort: sinon.stub().returns(mockMaintenanceWindows),
				}),
			}),
		});
		maintenanceWindowFindByIdAndDeleteStub = sinon.stub(
			MaintenanceWindow,
			"findByIdAndDelete"
		);
		maintenanceWindowDeleteManyStub = sinon.stub(MaintenanceWindow, "deleteMany");
		maintenanceWindowFindByIdAndUpdateStub = sinon.stub(
			MaintenanceWindow,
			"findByIdAndUpdate"
		);
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("createMaintenanceWindow", function () {
		it("should save a new maintenance window", async function () {
			maintenanceWindowSaveStub.resolves(mockMaintenanceWindow);
			const result = await createMaintenanceWindow(mockMaintenanceWindow);
			expect(result).to.deep.equal(mockMaintenanceWindow);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowSaveStub.rejects(err);
			try {
				await createMaintenanceWindow(mockMaintenanceWindow);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("getMaintenanceWindowById", function () {
		it("should return a maintenance window", async function () {
			maintenanceWindowFindByIdStub.resolves(mockMaintenanceWindow);
			const result = await getMaintenanceWindowById(mockMaintenanceWindow.id);
			expect(result).to.deep.equal(mockMaintenanceWindow);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowFindByIdStub.rejects(err);
			try {
				await getMaintenanceWindowById(mockMaintenanceWindow.id);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("getMaintenanceWindowsByTeamId", function () {
		let query;

		beforeEach(function () {
			query = {
				active: true,
				page: 1,
				rowsPerPage: 10,
				field: "name",
				order: "asc",
			};
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should return a list of maintenance windows and count", async function () {
			maintenanceWindowCountDocumentsStub.resolves(1);
			const result = await getMaintenanceWindowsByTeamId(
				mockMaintenanceWindow.teamId,
				query
			);
			expect(result).to.deep.equal({
				maintenanceWindows: mockMaintenanceWindows,
				maintenanceWindowCount: 1,
			});
		});

		it("should return a list of maintenance windows and count with empty query", async function () {
			query = undefined;
			maintenanceWindowCountDocumentsStub.resolves(1);
			const result = await getMaintenanceWindowsByTeamId(
				mockMaintenanceWindow.teamId,
				query
			);
			expect(result).to.deep.equal({
				maintenanceWindows: mockMaintenanceWindows,
				maintenanceWindowCount: 1,
			});
		});

		it("should return a list of maintenance windows and count with no pagination provided", async function () {
			query.page = undefined;
			query.rowsPerPage = undefined;
			maintenanceWindowCountDocumentsStub.resolves(1);
			const result = await getMaintenanceWindowsByTeamId(
				mockMaintenanceWindow.teamId,
				query
			);
			expect(result).to.deep.equal({
				maintenanceWindows: mockMaintenanceWindows,
				maintenanceWindowCount: 1,
			});
		});

		it("should return a list of maintenance windows and count with field and desc order", async function () {
			query.order = "desc";
			maintenanceWindowCountDocumentsStub.resolves(1);
			const result = await getMaintenanceWindowsByTeamId(
				mockMaintenanceWindow.teamId,
				query
			);
			expect(result).to.deep.equal({
				maintenanceWindows: mockMaintenanceWindows,
				maintenanceWindowCount: 1,
			});
		});

		it("should return a list of maintenance windows and count no field", async function () {
			query.field = undefined;
			maintenanceWindowCountDocumentsStub.resolves(1);
			const result = await getMaintenanceWindowsByTeamId(
				mockMaintenanceWindow.teamId,
				query
			);
			expect(result).to.deep.equal({
				maintenanceWindows: mockMaintenanceWindows,
				maintenanceWindowCount: 1,
			});
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowCountDocumentsStub.rejects(err);
			try {
				await getMaintenanceWindowsByTeamId(mockMaintenanceWindow.teamId, query);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("getMaintenanceWindowsByMonitorId", function () {
		it("should return a list of maintenance windows", async function () {
			maintenanceWindowFindStub.resolves(mockMaintenanceWindows);
			const result = await getMaintenanceWindowsByMonitorId(
				mockMaintenanceWindow.monitorId
			);
			expect(result).to.deep.equal(mockMaintenanceWindows);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowFindStub.rejects(err);
			try {
				await getMaintenanceWindowsByMonitorId(mockMaintenanceWindow.monitorId);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("deleteMaintenanceWindowById", function () {
		it("should delete a maintenance window", async function () {
			maintenanceWindowFindByIdAndDeleteStub.resolves(mockMaintenanceWindow);
			const result = await deleteMaintenanceWindowById(mockMaintenanceWindow.id);
			expect(result).to.deep.equal(mockMaintenanceWindow);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowFindByIdAndDeleteStub.rejects(err);
			try {
				await deleteMaintenanceWindowById(mockMaintenanceWindow.id);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("deleteMaintenanceWindowByMonitorId", function () {
		it("should return the number of documents deleted", async function () {
			maintenanceWindowDeleteManyStub.resolves({ deletedCount: 1 });
			const result = await deleteMaintenanceWindowByMonitorId(
				mockMaintenanceWindow.monitorId
			);
			expect(result).to.deep.equal({ deletedCount: 1 });
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowDeleteManyStub.rejects(err);
			try {
				await deleteMaintenanceWindowByMonitorId(mockMaintenanceWindow.monitorId);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("deleteMaintenanceWindowByUserId", function () {
		it("should return the number of documents deleted", async function () {
			maintenanceWindowDeleteManyStub.resolves({ deletedCount: 1 });
			const result = await deleteMaintenanceWindowByUserId(mockMaintenanceWindow.userId);
			expect(result).to.deep.equal({ deletedCount: 1 });
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowDeleteManyStub.rejects(err);
			try {
				await deleteMaintenanceWindowByUserId(mockMaintenanceWindow.userId);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("editMaintenanceWindowById", function () {
		it("should return the updated maintenance window", async function () {
			maintenanceWindowFindByIdAndUpdateStub.resolves(mockMaintenanceWindow);
			const result = await editMaintenanceWindowById(
				mockMaintenanceWindow.id,
				mockMaintenanceWindow
			);
			expect(result).to.deep.equal(mockMaintenanceWindow);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			maintenanceWindowFindByIdAndUpdateStub.rejects(err);
			try {
				await editMaintenanceWindowById(mockMaintenanceWindow.id, mockMaintenanceWindow);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});
});
