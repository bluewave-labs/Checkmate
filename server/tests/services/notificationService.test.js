import sinon from "sinon";
import NotificationService from "../../service/notificationService.js";
import { expect } from "chai";

describe("NotificationService", function () {
	let emailService, db, logger, notificationService;

	beforeEach(function () {
		db = {
			getNotificationsByMonitorId: sinon.stub(),
		};
		emailService = {
			buildAndSendEmail: sinon.stub(),
		};
		logger = {
			warn: sinon.stub(),
		};

		notificationService = new NotificationService(emailService, db, logger);
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("constructor", function () {
		it("should create a new instance of NotificationService", function () {
			expect(notificationService).to.be.an.instanceOf(NotificationService);
		});
	});

	describe("sendEmail", function () {
		it("should send an email notification with Up Template", async function () {
			const networkResponse = {
				monitor: {
					name: "Test Monitor",
					url: "http://test.com",
				},
				status: true,
				prevStatus: false,
			};
			const address = "test@test.com";
			await notificationService.sendEmail(networkResponse, address);
			expect(notificationService.emailService.buildAndSendEmail.calledOnce).to.be.true;
			expect(
				notificationService.emailService.buildAndSendEmail.calledWith(
					"serverIsUpTemplate",
					{ monitor: "Test Monitor", url: "http://test.com" }
				)
			);
		});

		it("should send an email notification with Down Template", async function () {
			const networkResponse = {
				monitor: {
					name: "Test Monitor",
					url: "http://test.com",
				},
				status: false,
				prevStatus: true,
			};
			const address = "test@test.com";
			await notificationService.sendEmail(networkResponse, address);
			expect(notificationService.emailService.buildAndSendEmail.calledOnce).to.be.true;
		});

		it("should send an email notification with Up Template", async function () {
			const networkResponse = {
				monitor: {
					name: "Test Monitor",
					url: "http://test.com",
				},
				status: true,
				prevStatus: false,
			};
			const address = "test@test.com";
			await notificationService.sendEmail(networkResponse, address);
			expect(notificationService.emailService.buildAndSendEmail.calledOnce).to.be.true;
		});
	});

	describe("handleNotifications", function () {
		it("should handle notifications based on the network response", async function () {
			notificationService.sendEmail = sinon.stub();
			const res = await notificationService.handleNotifications({
				monitor: {
					type: "email",
					address: "www.google.com",
				},
			});
			expect(res).to.be.true;
		});

		it("should handle hardware notifications", async function () {
			notificationService.sendEmail = sinon.stub();
			const res = await notificationService.handleNotifications({
				monitor: {
					type: "hardware",
					address: "www.google.com",
				},
			});
			expect(res).to.be.true;
		});

		it("should handle an error when getting notifications", async function () {
			const testError = new Error("Test Error");
			notificationService.db.getNotificationsByMonitorId.rejects(testError);
			await notificationService.handleNotifications({ monitorId: "123" });
			expect(notificationService.logger.warn.calledOnce).to.be.true;
		});
	});

	describe("sendHardwareEmail", function () {
		let networkResponse, address, alerts;

		beforeEach(function () {
			networkResponse = {
				monitor: {
					name: "Test Monitor",
					url: "http://test.com",
				},
				status: true,
				prevStatus: false,
			};
			address = "test@test.com";
			alerts = ["test"];
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should send an email notification with Hardware Template", async function () {
			emailService.buildAndSendEmail.resolves(true);
			const res = await notificationService.sendHardwareEmail(
				networkResponse,
				address,
				alerts
			);
			expect(res).to.be.true;
		});

		it("should return false if no alerts are provided", async function () {
			alerts = [];
			emailService.buildAndSendEmail.resolves(true);
			const res = await notificationService.sendHardwareEmail(
				networkResponse,
				address,
				alerts
			);
			expect(res).to.be.false;
		});
	});

	describe("handleStatusNotifications", function () {
		let networkResponse;

		beforeEach(function () {
			networkResponse = {
				monitor: {
					name: "Test Monitor",
					url: "http://test.com",
				},
				statusChanged: true,
				status: true,
				prevStatus: false,
			};
		});

		afterEach(function () {
			sinon.restore();
		});

		it("should handle status notifications", async function () {
			db.getNotificationsByMonitorId.resolves([
				{ type: "email", address: "test@test.com" },
			]);
			const res = await notificationService.handleStatusNotifications(networkResponse);
			expect(res).to.be.true;
		});

		it("should return false if status hasn't changed", async function () {
			networkResponse.statusChanged = false;
			const res = await notificationService.handleStatusNotifications(networkResponse);
			expect(res).to.be.false;
		});

		it("should return false if prevStatus is undefined", async function () {
			networkResponse.prevStatus = undefined;
			const res = await notificationService.handleStatusNotifications(networkResponse);
			expect(res).to.be.false;
		});

		it("should handle an error", async function () {
			const testError = new Error("Test Error");
			db.getNotificationsByMonitorId.rejects(testError);
			try {
				await notificationService.handleStatusNotifications(networkResponse);
			} catch (error) {
				expect(error).to.be.an.instanceOf(Error);
				expect(error.message).to.equal("Test Error");
			}
		});
	});

	describe("handleHardwareNotifications", function () {
		let networkResponse;

		beforeEach(function () {
			networkResponse = {
				monitor: {
					name: "Test Monitor",
					url: "http://test.com",
					thresholds: {
						usage_cpu: 1,
						usage_memory: 1,
						usage_disk: 1,
					},
				},
				payload: {
					data: {
						cpu: {
							usage_percent: 0.655,
						},
						memory: {
							usage_percent: 0.783,
						},
						disk: [
							{
								name: "/dev/sda1",
								usage_percent: 0.452,
							},
							{
								name: "/dev/sdb1",
								usage_percent: 0.627,
							},
						],
					},
				},
			};
		});

		afterEach(function () {
			sinon.restore();
		});

		describe("it should return false if no thresholds are set", function () {
			it("should return false if no thresholds are set", async function () {
				networkResponse.monitor.thresholds = undefined;
				const res =
					await notificationService.handleHardwareNotifications(networkResponse);
				expect(res).to.be.false;
			});

			it("should return false if metrics are null", async function () {
				networkResponse.payload.data = null;
				const res =
					await notificationService.handleHardwareNotifications(networkResponse);
				expect(res).to.be.false;
			});

			it("should return true if request is well formed and thresholds > 0", async function () {
				db.getNotificationsByMonitorId.resolves([
					{
						type: "email",
						address: "test@test.com",
						alertThreshold: 1,
						cpuAlertThreshold: 1,
						memoryAlertThreshold: 1,
						diskAlertThreshold: 1,
						save: sinon.stub().resolves(),
					},
				]);
				const res =
					await notificationService.handleHardwareNotifications(networkResponse);
				expect(res).to.be.true;
			});

			it("should return true if thresholds are exceeded", async function () {
				db.getNotificationsByMonitorId.resolves([
					{
						type: "email",
						address: "test@test.com",
						alertThreshold: 1,
						cpuAlertThreshold: 1,
						memoryAlertThreshold: 1,
						diskAlertThreshold: 1,
						save: sinon.stub().resolves(),
					},
				]);
				networkResponse.monitor.thresholds = {
					usage_cpu: 0.01,
					usage_memory: 0.01,
					usage_disk: 0.01,
				};
				const res =
					await notificationService.handleHardwareNotifications(networkResponse);
				expect(res).to.be.true;
			});
		});
	});
});
