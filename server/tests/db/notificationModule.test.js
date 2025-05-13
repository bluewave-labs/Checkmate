import sinon from "sinon";
import Notification from "../../db/models/Notification.js";
import {
	createNotification,
	getNotificationsByMonitorId,
	deleteNotificationsByMonitorId,
} from "../../db/mongo/modules/notificationModule.js";

describe("notificationModule", function () {
	const mockNotification = {
		monitorId: "123",
	};
	const mockNotifications = [mockNotification];
	let notificationSaveStub, notificationFindStub, notificationDeleteManyStub;

	beforeEach(function () {
		notificationSaveStub = sinon.stub(Notification.prototype, "save").resolves();
		notificationFindStub = sinon.stub(Notification, "find").resolves();
		notificationDeleteManyStub = sinon.stub(Notification, "deleteMany").resolves();
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("createNotification", function () {
		it("should create a new notification", async function () {
			const notificationData = { _id: "123", name: "test" };
			notificationSaveStub.resolves(notificationData);
			const res = await createNotification(notificationData);
			expect(res).to.deep.equal(notificationData);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			notificationSaveStub.rejects(err);
			try {
				await createNotification(mockNotification);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("getNotificationsByMonitorId", function () {
		it("should return notifications by monitor ID", async function () {
			notificationFindStub.resolves(mockNotifications);
			const res = await getNotificationsByMonitorId(mockNotification.monitorId);
			expect(res).to.deep.equal(mockNotifications);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			notificationFindStub.rejects(err);
			try {
				await getNotificationsByMonitorId(mockNotification.monitorId);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});

	describe("deleteNotificationsByMonitorId", function () {
		it("should delete notifications by monitor ID", async function () {
			notificationDeleteManyStub.resolves({ deletedCount: mockNotifications.length });
			const res = await deleteNotificationsByMonitorId(mockNotification.monitorId);
			expect(res).to.deep.equal(mockNotifications.length);
		});

		it("should handle an error", async function () {
			const err = new Error("test error");
			notificationDeleteManyStub.rejects(err);
			try {
				await deleteNotificationsByMonitorId(mockNotification.monitorId);
			} catch (error) {
				expect(error).to.deep.equal(err);
			}
		});
	});
});
