import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, json, okJson, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import {
	createNotificationBodyValidation,
	deleteNotificationParamValidation,
	getNotificationByIdParamValidation,
	editNotificationParamValidation,
	testAllNotificationsBodyValidation,
} from "@/validation/notificationValidation.js";

const tags = ["notifications"];

registry.registerPath({
	method: "post",
	path: "/notifications",
	tags,
	summary: "Create a notification channel (any of: email, webhook, slack, discord, pager_duty, matrix, teams, telegram, pushover, twilio)",
	security: bearer,
	request: { body: { content: json(createNotificationBodyValidation) } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/notifications/test/all",
	tags,
	summary: "Send a test alert through every notification channel for the team",
	security: bearer,
	request: { body: { content: json(testAllNotificationsBodyValidation) } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/notifications/test",
	tags,
	summary: "Send a test alert through a single notification channel",
	security: bearer,
	request: { body: { content: json(createNotificationBodyValidation) } },
	responses: { "200": okJson(z.object({ success: z.boolean() }).passthrough()), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/notifications/team",
	tags,
	summary: "List notification channels for the caller's team",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/notifications/{id}",
	tags,
	summary: "Get a notification channel by id",
	security: bearer,
	request: { params: getNotificationByIdParamValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/notifications/{id}",
	tags,
	summary: "Delete a notification channel",
	security: bearer,
	request: { params: deleteNotificationParamValidation },
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/notifications/{id}",
	tags,
	summary: "Edit a notification channel",
	security: bearer,
	request: { params: editNotificationParamValidation, body: { content: json(createNotificationBodyValidation) } },
	responses: { "200": okUnknown, ...standardErrors },
});
