import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { NotificationsService } from "../../../src/domain/notifications/notification.service.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { Notification } from "../../../src/domain/notifications/notification.type.ts";
import type { MonitorStatusResponse } from "../../../src/types/network.ts";
import type { MonitorActionDecision } from "../../../src/worker/worker.helper.ts";

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
});

const createMessageBuilder = () => ({
	buildMessage: jest.fn().mockReturnValue({ type: "monitor_down", content: { title: "Down" } }),
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
		const storedMatrixChannel = makeNotification({
			type: "matrix",
			homeserverUrl: "https://matrix.example.com",
			roomId: "!room:example.com",
			accessToken: "stored-token",
		});

		it("delegates to repository", async () => {
			const updated = makeNotification({ address: "new@example.com" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(makeNotification());
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateById("notif-1", "team-1", { address: "new@example.com" });
			expect(result).toBe(updated);
		});

		it("refuses to keep a stored credential while repointing the channel", async () => {
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrixChannel);

			await expect(
				service.updateById("notif-1", "team-1", {
					type: "matrix",
					homeserverUrl: "https://evil.example.com",
					roomId: "!room:example.com",
				})
			).rejects.toMatchObject({
				status: 400,
				message: "Enter the credentials again to use this channel with a different destination",
			});

			expect(notificationsRepository.updateById).not.toHaveBeenCalled();
		});

		it("refuses a conversion that would leave the channel unable to send", async () => {
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "telegram", address: "-100111", accessToken: "stored-token" })
			);

			// The stored Telegram bot token must not follow the channel to Matrix, where it would be
			// presented to whatever homeserver the caller named. But Matrix cannot send without one, so
			// silently dropping it would leave a channel that looks configured and never alerts.
			await expect(
				service.updateById("notif-1", "team-1", {
					type: "matrix",
					homeserverUrl: "https://evil.example.com",
					roomId: "!room:example.com",
				})
			).rejects.toMatchObject({
				status: 400,
				message: "Enter the credentials for the channel type you are switching to",
			});

			expect(notificationsRepository.updateById).not.toHaveBeenCalled();
		});

		it("drops a stale credential when converting to a channel that cannot use one", async () => {
			const updated = makeNotification({ type: "ntfy" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "telegram", address: "-100111", accessToken: "stored-token" })
			);
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			await service.updateById("notif-1", "team-1", { type: "ntfy", address: "https://ntfy.sh", topic: "alerts" });

			expect(notificationsRepository.updateById).toHaveBeenCalledWith("notif-1", "team-1", expect.objectContaining({ accessToken: "" }));
		});

		it("converts a credentialed channel to one whose schema has no credential field", async () => {
			// teams and ntfy do not declare accessToken, so it is stripped before the service sees it.
			// Refusing the edit here would be unsatisfiable: there is no way to send the field back.
			const updated = makeNotification({ type: "teams" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrixChannel);
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateById("notif-1", "team-1", {
				type: "teams",
				address: "https://teams.example.com/webhook",
			});

			expect(result).toBe(updated);
			expect(notificationsRepository.updateById).toHaveBeenCalledWith("notif-1", "team-1", expect.objectContaining({ accessToken: "" }));
		});

		it("keeps a credential the caller supplied while changing the provider", async () => {
			const updated = makeNotification({ type: "matrix" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "telegram", address: "-100111", accessToken: "stored-token" })
			);
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			await service.updateById("notif-1", "team-1", {
				type: "matrix",
				homeserverUrl: "https://matrix.example.com",
				roomId: "!room:example.com",
				accessToken: "typed-token",
			});

			expect(notificationsRepository.updateById).toHaveBeenCalledWith("notif-1", "team-1", expect.objectContaining({ accessToken: "typed-token" }));
		});

		it("allows a repointing edit that supplies the credential explicitly", async () => {
			const updated = makeNotification({ type: "matrix", homeserverUrl: "https://other.example.com" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrixChannel);
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateById("notif-1", "team-1", {
				type: "matrix",
				homeserverUrl: "https://other.example.com",
				roomId: "!room:example.com",
				accessToken: "typed-token",
			});

			expect(result).toBe(updated);
		});

		it("allows an edit that leaves the destination alone", async () => {
			const updated = makeNotification({ type: "matrix", roomId: "!other:example.com" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrixChannel);
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateById("notif-1", "team-1", {
				type: "matrix",
				homeserverUrl: "https://matrix.example.com",
				roomId: "!other:example.com",
			});

			expect(result).toBe(updated);
		});

		it.each([["webhook"], ["slack"], ["discord"], ["teams"], ["rocket_chat"], ["ntfy"]] as const)(
			"lets %s change its address even with a leftover credential it cannot use",
			async (type) => {
				// These providers never read accessToken, so a credential left behind by an earlier type
				// change is inert. Treating it as live made the address unchangeable, and for teams,
				// rocket_chat and ntfy the field could not even be cleared, so the record was stuck.
				const updated = makeNotification({ type, address: "https://elsewhere.example.com/hook" });
				const { service, notificationsRepository } = createService();
				(notificationsRepository.findById as jest.Mock).mockResolvedValue(
					makeNotification({ type, address: "https://example.com/hook", accessToken: "leftover-token" })
				);
				(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

				const result = await service.updateById("notif-1", "team-1", { type, address: "https://elsewhere.example.com/hook" });

				expect(result).toBe(updated);
			}
		);

		it("keeps a credential on a patch that touches neither the type nor a destination", async () => {
			const updated = makeNotification({ type: "telegram", notificationName: "Renamed" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "telegram", address: "-100111", accessToken: "stored-token" })
			);
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			await service.updateById("notif-1", "team-1", { type: "telegram", address: "-100111", notificationName: "Renamed" });

			// The stored credential is kept by absence: the patch must not carry the field at all, and
			// must not blank it either.
			expect(notificationsRepository.updateById).toHaveBeenCalledWith(
				"notif-1",
				"team-1",
				expect.not.objectContaining({ accessToken: expect.anything() })
			);
		});

		it("does not restrict a channel that has no stored credential", async () => {
			const updated = makeNotification({ type: "webhook", address: "https://elsewhere.example.com/hook" });
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "webhook", address: "https://example.com/hook", accessToken: undefined })
			);
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateById("notif-1", "team-1", {
				type: "webhook",
				address: "https://elsewhere.example.com/hook",
			});

			expect(result).toBe(updated);
		});

		it("looks the stored notification up scoped to the caller's team", async () => {
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(makeNotification());
			(notificationsRepository.updateById as jest.Mock).mockResolvedValue(makeNotification());

			await service.updateById("notif-1", "team-1", { notificationName: "Renamed" });

			expect(notificationsRepository.findById).toHaveBeenCalledWith("notif-1", "team-1");
		});
	});

	// ── credentials on the send path ──────────────────────────────────────────

	describe("credentials reaching the providers", () => {
		it("still hands the provider the stored credential when an alert fires", async () => {
			const { service, notificationsRepository, telegramProvider } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([
				makeNotification({ type: "telegram", accessToken: "stored-token" }),
			]);

			await service.handleNotifications(makeMonitor(), makeStatusResponse(), makeDecision());

			expect(telegramProvider.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "stored-token" }), expect.anything());
		});

		it("still hands the provider the stored credential when testing every channel of a monitor", async () => {
			const { service, notificationsRepository, telegramProvider } = createService();
			(notificationsRepository.findNotificationsByIds as jest.Mock).mockResolvedValue([
				makeNotification({ type: "telegram", accessToken: "stored-token" }),
			]);

			await service.testAllNotifications(["notif-1"]);

			expect(telegramProvider.sendTestAlert).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "stored-token" }));
		});
	});

	// ── sendTestNotificationById ──────────────────────────────────────────────

	describe("sendTestNotificationById", () => {
		const storedMatrix = makeNotification({
			type: "matrix",
			homeserverUrl: "https://matrix.example.com",
			roomId: "!room:example.com",
			accessToken: "stored-token",
		});

		it("fills in a credential the caller left out from the stored notification", async () => {
			const { service, notificationsRepository, matrixProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrix);

			const result = await service.sendTestNotificationById("notif-1", "team-1", {
				type: "matrix",
				homeserverUrl: "https://matrix.example.com",
				roomId: "!other:example.com",
			});

			expect(result).toBe(true);
			expect(matrixProvider.sendTestAlert).toHaveBeenCalledWith(
				expect.objectContaining({ accessToken: "stored-token", roomId: "!other:example.com" })
			);
		});

		it("uses the credential the caller supplied instead of the stored one", async () => {
			const { service, notificationsRepository, matrixProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrix);

			await service.sendTestNotificationById("notif-1", "team-1", {
				type: "matrix",
				homeserverUrl: "https://evil.example.com",
				roomId: "!room:example.com",
				accessToken: "typed-token",
			});

			expect(matrixProvider.sendTestAlert).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "typed-token" }));
		});

		it("refuses to send a stored credential to a destination the caller changed", async () => {
			const { service, notificationsRepository, matrixProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrix);

			await expect(
				service.sendTestNotificationById("notif-1", "team-1", {
					type: "matrix",
					homeserverUrl: "https://evil.example.com",
					roomId: "!room:example.com",
				})
			).rejects.toMatchObject({
				status: 400,
				message: "Enter the credentials again to use this channel with a different destination",
			});

			expect(matrixProvider.sendTestAlert).not.toHaveBeenCalled();
		});

		it("allows any change for a channel whose provider posts to a fixed host", async () => {
			const { service, notificationsRepository, telegramProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "telegram", address: "-100111", accessToken: "stored-token" })
			);

			await service.sendTestNotificationById("notif-1", "team-1", { type: "telegram", address: "-100999" });

			expect(telegramProvider.sendTestAlert).toHaveBeenCalledWith(expect.objectContaining({ address: "-100999", accessToken: "stored-token" }));
		});

		it("refuses to test a saved channel as a different type", async () => {
			const { service, notificationsRepository, telegramProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrix);

			// The message matters: without it this passes even with the type check deleted, because the
			// destination guard happens to throw its own 400 for this fixture.
			await expect(service.sendTestNotificationById("notif-1", "team-1", { type: "telegram", address: "-100999" })).rejects.toMatchObject({
				status: 400,
				message: "Notification type does not match the saved channel",
			});

			expect(telegramProvider.sendTestAlert).not.toHaveBeenCalled();
		});

		it("refuses to test a fixed-host channel as a host-addressed one", async () => {
			// The reverse direction, and the reason the type check is load-bearing rather than tidiness:
			// telegram has no destination fields, so the destination guard structurally cannot fire, and
			// only the type check stands between the stored bot token and a caller-named homeserver.
			const { service, notificationsRepository, matrixProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "telegram", address: "-100111", accessToken: "stored-token" })
			);

			await expect(
				service.sendTestNotificationById("notif-1", "team-1", {
					type: "matrix",
					homeserverUrl: "https://evil.example.com",
					roomId: "!room:example.com",
				})
			).rejects.toMatchObject({
				status: 400,
				message: "Notification type does not match the saved channel",
			});

			expect(matrixProvider.sendTestAlert).not.toHaveBeenCalled();
		});

		it("does not apply the destination check when there is no stored credential to fill in", async () => {
			const { service, notificationsRepository, webhookProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(
				makeNotification({ type: "webhook", address: "https://example.com/hook", accessToken: undefined })
			);

			await service.sendTestNotificationById("notif-1", "team-1", { type: "webhook", address: "https://elsewhere.example.com/hook" });

			expect(webhookProvider.sendTestAlert).toHaveBeenCalledWith(expect.objectContaining({ address: "https://elsewhere.example.com/hook" }));
		});

		it("treats a stored empty credential as no credential to fill in", async () => {
			const { service, notificationsRepository, matrixProvider } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(makeNotification({ ...storedMatrix, accessToken: "" }));

			await service.sendTestNotificationById("notif-1", "team-1", {
				type: "matrix",
				homeserverUrl: "https://elsewhere.example.com",
				roomId: "!room:example.com",
			});

			expect(matrixProvider.sendTestAlert).toHaveBeenCalledWith(expect.not.objectContaining({ accessToken: expect.anything() }));
		});

		it("looks the notification up scoped to the caller's team", async () => {
			const { service, notificationsRepository } = createService();
			(notificationsRepository.findById as jest.Mock).mockResolvedValue(storedMatrix);

			await service.sendTestNotificationById("notif-1", "team-1", {
				type: "matrix",
				homeserverUrl: "https://matrix.example.com",
				roomId: "!room:example.com",
			});

			expect(notificationsRepository.findById).toHaveBeenCalledWith("notif-1", "team-1");
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
	});
});
