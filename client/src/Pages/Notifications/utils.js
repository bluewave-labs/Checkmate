export const NOTIFICATION_TYPES = [
	{ _id: 1, name: "E-mail", value: "email" },
	{ _id: 2, name: "Slack", value: "slack" },
	{ _id: 3, name: "PagerDuty", value: "pager_duty" },
	{ _id: 4, name: "Webhook", value: "webhook" },
	{ _id: 5, name: "Discord", value: "discord" },
];

export const TITLE_MAP = {
	email: "createNotifications.emailSettings.title",
	slack: "createNotifications.slackSettings.title",
	pager_duty: "createNotifications.pagerDutySettings.title",
	webhook: "createNotifications.webhookSettings.title",
	discord: "createNotifications.discordSettings.title",
};

export const DESCRIPTION_MAP = {
	email: "createNotifications.emailSettings.description",
	slack: "createNotifications.slackSettings.description",
	pager_duty: "createNotifications.pagerDutySettings.description",
	webhook: "createNotifications.webhookSettings.description",
	discord: "createNotifications.discordSettings.description",
};

export const LABEL_MAP = {
	email: "createNotifications.emailSettings.emailLabel",
	slack: "createNotifications.slackSettings.webhookLabel",
	pager_duty: "createNotifications.pagerDutySettings.integrationKeyLabel",
	webhook: "createNotifications.webhookSettings.webhookLabel",
	discord: "createNotifications.discordSettings.webhookLabel",
};

export const PLACEHOLDER_MAP = {
	email: "createNotifications.emailSettings.emailPlaceholder",
	slack: "createNotifications.slackSettings.webhookPlaceholder",
	pager_duty: "createNotifications.pagerDutySettings.integrationKeyPlaceholder",
	webhook: "createNotifications.webhookSettings.webhookPlaceholder",
	discord: "createNotifications.discordSettings.webhookPlaceholder",
};

export const WEBHOOK_AUTH_TYPES = [
	{ _id: "none", name: "None" },
	{ _id: "basic", name: "Basic Auth" },
	{ _id: "bearer", name: "Bearer Token" },
];
