import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import NotificationController from "../../../src/api/controllers/notificationController.ts";
import type { INotificationsService } from "../../../src/domain/notifications/notification.service.ts";
import type { IMonitorsRepository } from "../../../src/domain/monitors/monitor.repository.interface.ts";
import { notificationResponseSchema } from "../../../src/api/validation/notificationValidation.ts";
import type { Notification } from "../../../src/domain/notifications/notification.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeNotification = (overrides?: Partial<Notification>): Notification =>
	({
		id: "notif-1",
		userId: "user-1",
		teamId: "team-1",
		type: "telegram",
		notificationName: "Telegram alerts",
		address: "-1001234567890",
		accessToken: "super-secret-bot-token",
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Notification;

const makeResponse = () => {
	const json = jest.fn();
	const status = jest.fn(() => ({ json }));
	return { res: { status } as unknown as Response, status, json };
};

const makeRequest = (overrides?: Partial<Request>): Request =>
	({
		params: {},
		body: {},
		user: { id: "user-1", teamId: "team-1" },
		...overrides,
	}) as unknown as Request;

const setup = (serviceOverrides?: Partial<INotificationsService>) => {
	const notificationsService = {
		createNotification: jest.fn(),
		findById: jest.fn(),
		findNotificationsByTeamId: jest.fn(),
		updateById: jest.fn(),
		deleteById: jest.fn(),
		handleNotifications: jest.fn(),
		sendTestNotification: jest.fn(),
		sendTestNotificationById: jest.fn(),
		testAllNotifications: jest.fn(),
		...serviceOverrides,
	} as unknown as INotificationsService;

	const monitorsRepository = {} as IMonitorsRepository;
	const controller = new NotificationController(notificationsService, monitorsRepository);
	const next = jest.fn() as unknown as NextFunction;

	return { controller, notificationsService, next };
};

const dataFrom = (json: jest.Mock) => (json.mock.calls[0][0] as { data: Record<string, unknown> }).data;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("notificationController — credentials in responses", () => {
	it("omits the credential and reports that one is stored when fetching by id", async () => {
		const { controller, next } = setup({
			findById: jest.fn<INotificationsService["findById"]>().mockResolvedValue(makeNotification()),
		});
		const { res, json } = makeResponse();

		await controller.getNotificationById(makeRequest({ params: { id: "notif-1" } }), res, next);

		const data = dataFrom(json);
		expect(data).not.toHaveProperty("accessToken");
		expect(data.accessTokenSet).toBe(true);
		expect(data.notificationName).toBe("Telegram alerts");
	});

	it("reports no stored credential when the channel has none", async () => {
		const notification = makeNotification({ type: "webhook", accessToken: undefined });
		const { controller, next } = setup({
			findById: jest.fn<INotificationsService["findById"]>().mockResolvedValue(notification),
		});
		const { res, json } = makeResponse();

		await controller.getNotificationById(makeRequest({ params: { id: "notif-1" } }), res, next);

		expect(dataFrom(json).accessTokenSet).toBe(false);
	});

	it("treats a stored empty credential as no credential", async () => {
		const { controller, next } = setup({
			findById: jest.fn<INotificationsService["findById"]>().mockResolvedValue(makeNotification({ accessToken: "" })),
		});
		const { res, json } = makeResponse();

		await controller.getNotificationById(makeRequest({ params: { id: "notif-1" } }), res, next);

		expect(dataFrom(json).accessTokenSet).toBe(false);
	});

	it("omits the credential from every notification in the team listing", async () => {
		const notifications = [makeNotification(), makeNotification({ id: "notif-2", accessToken: undefined })];
		const { controller, next } = setup({
			findNotificationsByTeamId: jest.fn<INotificationsService["findNotificationsByTeamId"]>().mockResolvedValue(notifications),
		});
		const { res, json } = makeResponse();

		await controller.getNotificationsByTeamId(makeRequest(), res, next);

		const data = (json.mock.calls[0][0] as { data: Record<string, unknown>[] }).data;
		expect(data).toHaveLength(2);
		expect(data[0]).not.toHaveProperty("accessToken");
		expect(data[1]).not.toHaveProperty("accessToken");
		expect(data[0].accessTokenSet).toBe(true);
		expect(data[1].accessTokenSet).toBe(false);
	});

	it("omits the credential from the create response", async () => {
		const { controller, next } = setup({
			createNotification: jest.fn<INotificationsService["createNotification"]>().mockResolvedValue(makeNotification()),
		});
		const { res, json } = makeResponse();
		const body = { notificationName: "Telegram alerts", type: "telegram", address: "-1001234567890", accessToken: "super-secret-bot-token" };

		await controller.createNotification(makeRequest({ body }), res, next);

		expect(dataFrom(json)).not.toHaveProperty("accessToken");
		expect(dataFrom(json).accessTokenSet).toBe(true);
	});

	it("omits the credential from the edit response", async () => {
		const { controller, next } = setup({
			updateById: jest.fn<INotificationsService["updateById"]>().mockResolvedValue(makeNotification()),
		});
		const { res, json } = makeResponse();
		const body = { notificationName: "Renamed", type: "telegram", address: "-1001234567890" };

		await controller.editNotification(makeRequest({ params: { id: "notif-1" }, body }), res, next);

		expect(dataFrom(json)).not.toHaveProperty("accessToken");
	});

	it("returns exactly the shape the OpenAPI spec documents", async () => {
		const { controller, next } = setup({
			findById: jest.fn<INotificationsService["findById"]>().mockResolvedValue(makeNotification()),
		});
		const { res, json } = makeResponse();

		await controller.getNotificationById(makeRequest({ params: { id: "notif-1" } }), res, next);

		// strict() rejects any key the response schema does not document, so a field that starts
		// being returned without being added to the spec fails here.
		expect(() => notificationResponseSchema.strict().parse(dataFrom(json))).not.toThrow();
	});

	it("returns identifiers that are not credentials", async () => {
		const twilio = makeNotification({
			type: "twilio",
			accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			twilioPhoneNumber: "+15557654321",
			phone: "+15551234567",
		});
		const { controller, next } = setup({
			findById: jest.fn<INotificationsService["findById"]>().mockResolvedValue(twilio),
		});
		const { res, json } = makeResponse();

		await controller.getNotificationById(makeRequest({ params: { id: "notif-1" } }), res, next);

		const data = dataFrom(json);
		expect(data.accountSid).toBe("ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
		expect(data.twilioPhoneNumber).toBe("+15557654321");
		expect(data).not.toHaveProperty("accessToken");
	});
});

describe("notificationController — editing without the credential", () => {
	it("forwards a patch that leaves the credential out, so the stored one is kept", async () => {
		const updateById = jest.fn<INotificationsService["updateById"]>().mockResolvedValue(makeNotification());
		const { controller, next } = setup({ updateById });
		const { res } = makeResponse();
		const body = { notificationName: "Renamed", type: "telegram", address: "-1001234567890" };

		await controller.editNotification(makeRequest({ params: { id: "notif-1" }, body }), res, next);

		expect(updateById).toHaveBeenCalledTimes(1);
		const [, , patch] = updateById.mock.calls[0];
		expect(patch).not.toHaveProperty("accessToken");
	});

	it("forwards a replacement credential when one is sent", async () => {
		const updateById = jest.fn<INotificationsService["updateById"]>().mockResolvedValue(makeNotification());
		const { controller, next } = setup({ updateById });
		const { res } = makeResponse();
		const body = { notificationName: "Renamed", type: "telegram", address: "-1001234567890", accessToken: "new-token" };

		await controller.editNotification(makeRequest({ params: { id: "notif-1" }, body }), res, next);

		const [, , patch] = updateById.mock.calls[0];
		expect(patch).toHaveProperty("accessToken", "new-token");
	});
});

describe("notificationController: testing a saved channel", () => {
	const body = { notificationName: "Telegram alerts", type: "telegram", address: "-1001234567890" };

	it("passes the id from the path and the team from the caller's token", async () => {
		const sendTestNotificationById = jest.fn<INotificationsService["sendTestNotificationById"]>().mockResolvedValue(true);
		const { controller, next } = setup({ sendTestNotificationById });
		const { res, json } = makeResponse();

		await controller.testSavedNotification(makeRequest({ params: { id: "notif-1" }, body }), res, next);

		expect(sendTestNotificationById).toHaveBeenCalledWith("notif-1", "team-1", expect.objectContaining({ type: "telegram" }));
		expect(next).not.toHaveBeenCalled();
		expect((json.mock.calls[0][0] as { success: boolean }).success).toBe(true);
	});

	it("ignores a teamId supplied in the body", async () => {
		// Otherwise this endpoint would hand any team's stored credential to a caller-named destination.
		const sendTestNotificationById = jest.fn<INotificationsService["sendTestNotificationById"]>().mockResolvedValue(true);
		const { controller, next } = setup({ sendTestNotificationById });
		const { res } = makeResponse();

		await controller.testSavedNotification(makeRequest({ params: { id: "notif-1" }, body: { ...body, teamId: "team-victim" } }), res, next);

		expect(sendTestNotificationById).toHaveBeenCalledWith("notif-1", "team-1", expect.anything());
	});

	it("validates the body with the edit schema, so an empty credential is refused", async () => {
		const sendTestNotificationById = jest.fn<INotificationsService["sendTestNotificationById"]>().mockResolvedValue(true);
		const { controller, next } = setup({ sendTestNotificationById });
		const { res } = makeResponse();

		await controller.testSavedNotification(makeRequest({ params: { id: "notif-1" }, body: { ...body, accessToken: "" } }), res, next);

		expect(sendTestNotificationById).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalled();
	});

	it("reports a failed send without claiming success", async () => {
		const sendTestNotificationById = jest.fn<INotificationsService["sendTestNotificationById"]>().mockResolvedValue(false);
		const { controller, next } = setup({ sendTestNotificationById });
		const { res, json } = makeResponse();

		await controller.testSavedNotification(makeRequest({ params: { id: "notif-1" }, body }), res, next);

		expect((json.mock.calls[0][0] as { success: boolean }).success).toBe(false);
	});
});

describe("notificationResponseSchema", () => {
	it("refuses to document a credential, so the redaction cannot be undone by widening the schema", () => {
		const valid = {
			id: "notif-1",
			userId: "user-1",
			teamId: "team-1",
			type: "telegram",
			notificationName: "Telegram alerts",
			address: "-1001234567890",
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
			accessTokenSet: true,
		};

		expect(notificationResponseSchema.strict().safeParse(valid).success).toBe(true);
		expect(notificationResponseSchema.strict().safeParse({ ...valid, accessToken: "leaked" }).success).toBe(false);
	});
});
