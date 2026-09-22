import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { NotificationsService } from "../../../src/domain/notifications/notification.service.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { Notification } from "../../../src/domain/notifications/notification.type.ts";
import type { MonitorStatusResponse } from "../../../src/types/network.ts";
import type { MonitorActionDecision } from "../../../src/worker/worker.interface.ts";
import type { DockerContainerEvent } from "../../../src/domain/docker/docker.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createProvider = () => ({
	sendMessage: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
	sendTestAlert: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
});

const createNotificationsRepo = () => ({
	create: jest.fn(),
	findById: jest.fn(),
	findNotificationsByIds: jest.fn(),
	findByTeamId: jest.fn(),
	updateById: jest.fn(),
	deleteById: jest.fn(),
});

const createMonitorsRepo = () => ({
	removeNotificationFromMonitors: jest.fn(),
});

const createSettingsService = (clientHost = "https://app.example.com") => ({
	getSettings: jest.fn().mockReturnValue({ clientHost }),
	removeEgressNotification: jest.fn().mockResolvedValue(undefined),
});

const createMessageBuilder = () => ({
	buildMessage: jest.fn().mockReturnValue({ type: "monitor_down", content: { title: "Down" } }),
	buildContainerMessages: jest.fn().mockReturnValue([]),
	extractThresholdBreaches: jest.fn(),
});

const createService = (overrides?: Record<string, unknown>) => {
	const logger = createMockLogger();
	const notificationsRepository = createNotificationsRepo();
	const monitorsRepository = createMonitorsRepo();
	const webhookProvider = createProvider();
	const emailProvider = createProvider();
	const slackProvider = createProvider();
	const discordProvider = createProvider();
	const pagerDutyProvider = createProvider();
	const matrixProvider = createProvider();
	const teamsProvider = createProvider();
	const telegramProvider = createProvider();
	const pushoverProvider = createProvider();
	const twilioProvider = createProvider();
	const ntfyProvider = createProvider();
	const settingsService = createSettingsService();
	const notificationMessageBuilder = createMessageBuilder();

	const defaults = {
		logger,
		notificationsRepository,
		monitorsRepository,
		webhookProvider,
		emailProvider,
		slackProvider,
		discordProvider,
		pagerDutyProvider,
		matrixProvider,
		teamsProvider,
		telegramProvider,
		pushoverProvider,
		twilioProvider,
		ntfyProvider,
		settingsService,
		notificationMessageBuilder,
		...overrides,
	};

	const service = new NotificationsService({
		notificationsRepository: defaults.notificationsRepository,
		monitorsRepository: defaults.monitorsRepository,
		providers: {
			webhook: defaults.webhookProvider,
			email: defaults.emailProvider,
			slack: defaults.slackProvider,
			discord: defaults.discordProvider,
			pager_duty: defaults.pagerDutyProvider,
			matrix: defaults.matrixProvider,
			teams: defaults.teamsProvider,
			telegram: defaults.telegramProvider,
			pushover: defaults.pushoverProvider,
			twilio: defaults.twilioProvider,
			ntfy: defaults.ntfyProvider,
		},
		settingsService: defaults.settingsService,
		logger: defaults.logger,
		notificationMessageBuilder: defaults.notificationMessageBuilder,
	} as any);

	return { service, ...defaults };
};

const makeNotification = (overrides?: Partial<Notification>): Notification =>
	({
		id: "notif-1",
		userId: "user-1",
		teamId: "team-1",
		type: "email",
		notificationName: "Email Alert",
		address: "test@example.com",
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Notification;

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		teamId: "team-1",
		name: "Test Monitor",
		type: "http",
		notifications: ["notif-1"],
		...overrides,
	}) as Monitor;

const makeDecision = (overrides?: Partial<MonitorActionDecision>): MonitorActionDecision => ({
	shouldCreateIncident: false,
	shouldResolveIncident: false,
	shouldSendNotification: true,
	incidentReason: null,
	notificationReason: "status_change",
	...overrides,
});

const makeStatusResponse = () => ({ monitorId: "mon-1", status: false, code: 500 }) as unknown as MonitorStatusResponse;

const makeContainerEvent = (overrides?: Partial<DockerContainerEvent>): DockerContainerEvent => ({
	kind: "stopped",
	containerName: "web",
	containerId: "abc123",
	...overrides,
});

const containerAlertMessage = { type: "container_alert", content: { title: "Container Alert" } };
const containerRecoveredMessage = { type: "container_recovered", content: { title: "Container Recovered" } };

// ── Tests ────────────────────────────────────────────────────────────────────

describe("NotificationsService", () => {
	// ── handleNotifications ───────────────────────────────────────────────────

	describe("handleNotifications", () => {
		it("returns false when shouldSendNotification is false", async () => {
			const { service } = createService();
			const result = await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision({ shouldSendNotification: false }));
			expect(result).toBe(false);
		});

		it("sends notifications to all configured providers and returns true", async () => {
			const { service, notificationsRepository, emailProvider } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([makeNotification({ type: "email" })]);

			const result = await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision());

			expect(result).toBe(true);
			expect(emailProvider.sendMessage).toHaveBeenCalledTimes(1);
		});

		it("routes to correct provider for each notification type", async () => {
			const types = ["webhook", "slack", "matrix", "pager_duty", "discord", "email", "teams", "telegram", "pushover", "twilio", "ntfy"] as const;
			for (const type of types) {
				const deps = createService();
				(deps.notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([makeNotification({ type })]);

				await deps.service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision());

				const providerMap: Record<string, ReturnType<typeof createProvider>> = {
					webhook: deps.webhookProvider,
					slack: deps.slackProvider,
					matrix: deps.matrixProvider,
					pager_duty: deps.pagerDutyProvider,
					discord: deps.discordProvider,
					email: deps.emailProvider,
					teams: deps.teamsProvider,
					telegram: deps.telegramProvider,
					pushover: deps.pushoverProvider,
					twilio: deps.twilioProvider,
					ntfy: deps.ntfyProvider,
				};
				expect(providerMap[type].sendMessage).toHaveBeenCalledTimes(1);
			}
		});

		it("returns false and logs warning for unknown notification type", async () => {
			const { service, notificationsRepository, logger } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([makeNotification({ type: "carrier_pigeon" as any })]);

			const result = await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision());

			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("Unknown notification type: carrier_pigeon") })
			);
		});

		it("returns false and logs warning when notificationMessage is undefined", async () => {
			const notificationMessageBuilder = createMessageBuilder();
			notificationMessageBuilder.buildMessage.mockReturnValue(undefined);
			const { service, notificationsRepository, logger } = createService({ notificationMessageBuilder });
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([makeNotification()]);

			const result = await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision());

			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Notification message not provided" }));
		});

		it("handles monitors with no notification IDs", async () => {
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([]);

			const result = await service.handleNotifications(makeMonitor({ notifications: undefined as any }), makeStatusResponse(), makeDecision());

			expect(result).toBe(true);
			expect(notificationsRepository.findNotificationsByIds).toHaveBeenCalledWith([]);
		});

		it("returns false and logs when some notifications fail", async () => {
			const { service, notificationsRepository, emailProvider, slackProvider, logger } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([
				makeNotification({ id: "n1", type: "email" }),
				makeNotification({ id: "n2", type: "slack" }),
			]);
			emailProvider.sendMessage.mockResolvedValue(true);
			slackProvider.sendMessage.mockResolvedValue(false);

			const result = await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision());

			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("1 success, 1 failure") }));
		});

		it("uses fallback clientHost when settings.clientHost is empty", async () => {
			const settingsService = createSettingsService("");
			const { service, notificationsRepository, notificationMessageBuilder } = createService({ settingsService });
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([makeNotification()]);

			await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision());

			expect(notificationMessageBuilder.buildMessage).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.anything(),
				"Host not defined"
			);
		});

		it("sends only the container messages for container_events and never builds a status message", async () => {
			const notificationMessageBuilder = createMessageBuilder();
			notificationMessageBuilder.buildContainerMessages.mockReturnValue([containerAlertMessage]);
			const { service, notificationsRepository, emailProvider } = createService({ notificationMessageBuilder });
			const notification = makeNotification({ type: "email" });
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([notification]);
			const monitor = makeMonitor({ type: "docker" });
			const containerEvents = [makeContainerEvent()];

			const result = await service.handleNotifications(
				monitor,
				makeStatusResponse(),
				makeDecision({ notificationReason: "container_events", containerEvents })
			);

			expect(result).toBe(true);
			expect(notificationMessageBuilder.buildMessage).not.toHaveBeenCalled();
			expect(notificationMessageBuilder.buildContainerMessages).toHaveBeenCalledWith(monitor, containerEvents, "https://app.example.com");
			expect(emailProvider.sendMessage).toHaveBeenCalledTimes(1);
			expect(emailProvider.sendMessage).toHaveBeenCalledWith(notification, containerAlertMessage);
		});

		it("sends the status message and the container messages to every channel on a status_change with container events", async () => {
			const notificationMessageBuilder = createMessageBuilder();
			notificationMessageBuilder.buildContainerMessages.mockReturnValue([containerAlertMessage]);
			const { service, notificationsRepository, emailProvider, slackProvider } = createService({ notificationMessageBuilder });
			const emailNotification = makeNotification({ id: "n1", type: "email" });
			const slackNotification = makeNotification({ id: "n2", type: "slack" });
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([emailNotification, slackNotification]);
			const statusMessage = notificationMessageBuilder.buildMessage();

			const result = await service.handleNotifications(
				makeMonitor({ type: "docker" }),
				makeStatusResponse(),
				makeDecision({ notificationReason: "status_change", containerEvents: [makeContainerEvent()] })
			);

			expect(result).toBe(true);
			expect(notificationMessageBuilder.buildMessage).toHaveBeenCalled();
			expect(emailProvider.sendMessage).toHaveBeenCalledTimes(2);
			expect(emailProvider.sendMessage).toHaveBeenCalledWith(emailNotification, statusMessage);
			expect(emailProvider.sendMessage).toHaveBeenCalledWith(emailNotification, containerAlertMessage);
			expect(slackProvider.sendMessage).toHaveBeenCalledTimes(2);
			expect(slackProvider.sendMessage).toHaveBeenCalledWith(slackNotification, statusMessage);
			expect(slackProvider.sendMessage).toHaveBeenCalledWith(slackNotification, containerAlertMessage);
		});

		it("does not build container messages when containerEvents is empty", async () => {
			const { service, notificationsRepository, notificationMessageBuilder, emailProvider } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([makeNotification({ type: "email" })]);

			await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision({ containerEvents: [] }));

			expect(notificationMessageBuilder.buildContainerMessages).not.toHaveBeenCalled();
			expect(emailProvider.sendMessage).toHaveBeenCalledTimes(1);
		});

		it("makes four sendMessage calls for two container messages across two channels", async () => {
			const notificationMessageBuilder = createMessageBuilder();
			notificationMessageBuilder.buildContainerMessages.mockReturnValue([containerAlertMessage, containerRecoveredMessage]);
			const { service, notificationsRepository, emailProvider, slackProvider } = createService({ notificationMessageBuilder });
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([
				makeNotification({ id: "n1", type: "email" }),
				makeNotification({ id: "n2", type: "slack" }),
			]);

			const result = await service.handleNotifications(
				makeMonitor({ type: "docker" }),
				makeStatusResponse(),
				makeDecision({ notificationReason: "container_events", containerEvents: [makeContainerEvent(), makeContainerEvent({ kind: "started" })] })
			);

			expect(result).toBe(true);
			expect(emailProvider.sendMessage).toHaveBeenCalledTimes(2);
			expect(slackProvider.sendMessage).toHaveBeenCalledTimes(2);
			expect(emailProvider.sendMessage.mock.calls.length + slackProvider.sendMessage.mock.calls.length).toBe(4);
		});

		it("returns false when one of four container sends fails", async () => {
			const notificationMessageBuilder = createMessageBuilder();
			notificationMessageBuilder.buildContainerMessages.mockReturnValue([containerAlertMessage, containerRecoveredMessage]);
			const { service, notificationsRepository, emailProvider, slackProvider, logger } = createService({ notificationMessageBuilder });
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([
				makeNotification({ id: "n1", type: "email" }),
				makeNotification({ id: "n2", type: "slack" }),
			]);
			slackProvider.sendMessage.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

			const result = await service.handleNotifications(
				makeMonitor({ type: "docker" }),
				makeStatusResponse(),
				makeDecision({ notificationReason: "container_events", containerEvents: [makeContainerEvent(), makeContainerEvent({ kind: "started" })] })
			);

			expect(result).toBe(false);
			expect(emailProvider.sendMessage).toHaveBeenCalledTimes(2);
			expect(slackProvider.sendMessage).toHaveBeenCalledTimes(2);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("3 success, 1 failure") }));
		});
	});

	// ── sendTestNotification ─────────────────────────────────────────────────

	describe("sendTestNotification", () => {
		it.each([
			["email"],
			["slack"],
			["discord"],
			["pager_duty"],
			["matrix"],
			["webhook"],
			["teams"],
			["telegram"],
			["pushover"],
			["twilio"],
			["ntfy"],
		] as const)("routes %s to the correct provider", async (type) => {
			const deps = createService();
			const notification = makeNotification({ type: type as any });

			const result = await deps.service.sendTestNotification(notification);

			expect(result).toBe(true);
			const providerMap: Record<string, ReturnType<typeof createProvider>> = {
				webhook: deps.webhookProvider,
				slack: deps.slackProvider,
				matrix: deps.matrixProvider,
				pager_duty: deps.pagerDutyProvider,
				discord: deps.discordProvider,
				email: deps.emailProvider,
				teams: deps.teamsProvider,
				telegram: deps.telegramProvider,
				pushover: deps.pushoverProvider,
				twilio: deps.twilioProvider,
				ntfy: deps.ntfyProvider,
			};
			expect(providerMap[type].sendTestAlert).toHaveBeenCalledWith(notification);
		});

		it("returns false for unknown notification type", async () => {
			const { service } = createService();
			const result = await service.sendTestNotification(makeNotification({ type: "unknown" as any }));
			expect(result).toBe(false);
		});
	});

	// ── testAllNotifications ─────────────────────────────────────────────────

	describe("testAllNotifications", () => {
		it("returns true when all test alerts succeed", async () => {
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([
				makeNotification({ type: "email" }),
				makeNotification({ type: "slack" }),
			]);

			const result = await service.testAllNotifications(["notif-1", "notif-2"]);
			expect(result).toBe(true);
		});

		it("returns false when any test alert fails", async () => {
			const { service, notificationsRepository, emailProvider } = createService();
			emailProvider.sendTestAlert.mockResolvedValue(false);
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([makeNotification({ type: "email" })]);

			const result = await service.testAllNotifications(["notif-1"]);
			expect(result).toBe(false);
		});
	});

	// ── CRUD operations ──────────────────────────────────────────────────────

	describe("createNotification", () => {
		it("sets userId and teamId and delegates to repository", async () => {
			const created = makeNotification();
			const { service, notificationsRepository } = createService();
			(notificationsRepository.create as jest.Mock).mockResolvedValue(created);

			const result = await service.createNotification({ type: "email", address: "a@b.com" }, "user-1", "team-1");

			expect(result).toBe(created);
			expect(notificationsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", teamId: "team-1", type: "email" }));
		});
	});

	describe("findById", () => {
		it("delegates to repository", async () => {
			const notification = makeNotification();
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(notification);

			const result = await service.findById("notif-1", "team-1");
			expect(result).toBe(notification);
		});
	});

	describe("findNotificationsByTeamId", () => {
		it("delegates to repository", async () => {
			const notifications = [makeNotification()];
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findByTeamId as jest.Mock).mockResolvedValue(notifications);

			const result = await service.findNotificationsByTeamId("team-1");
			expect(result).toBe(notifications);
		});
	});

	describe("updateById", () => {
		it("delegates to repository", async () => {
			const updated = makeNotification({ address: "new@example.com" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateById("notif-1", "team-1", { address: "new@example.com" });
			expect(result).toBe(updated);
		});
	});

	describe("deleteById", () => {
		it("deletes notification and removes from monitors", async () => {
			const deleted = makeNotification();
			const { service, notificationsRepository, monitorsRepository } = createService();
			(notificationsRepository.deleteById as jest.Mock).mockResolvedValue(deleted);

			const result = await service.deleteById("notif-1", "team-1");

			expect(result).toBe(deleted);
			expect(monitorsRepository.removeNotificationFromMonitors).toHaveBeenCalledWith("notif-1");
		});

		it("removes the notification from the egress recovered recipients after the team-scoped delete succeeds", async () => {
			const { service, notificationsRepository, settingsService } = createService();
			(notificationsRepository.deleteById as jest.Mock).mockResolvedValue(makeNotification());

			await service.deleteById("notif-1", "team-1");

			expect(settingsService.removeEgressNotification).toHaveBeenCalledWith("notif-1");
			const deleteOrder = (notificationsRepository.deleteById as jest.Mock).mock.invocationCallOrder[0]!;
			const cascadeOrder = (settingsService.removeEgressNotification as jest.Mock).mock.invocationCallOrder[0]!;
			expect(deleteOrder).toBeLessThan(cascadeOrder);
		});

		it("does not touch app settings when the delete is refused", async () => {
			const { service, notificationsRepository, settingsService } = createService();
			(notificationsRepository.deleteById as jest.Mock).mockRejectedValue(new Error("Notification not found"));

			await expect(service.deleteById("notif-1", "other-team")).rejects.toThrow("Notification not found");

			expect(settingsService.removeEgressNotification).not.toHaveBeenCalled();
		});
	});
});
