export const NOTIFICATION_TYPES = [
	{ id: 1, name: "E-mail", value: "email" },
	{ id: 2, name: "Slack", value: "slack" },
	{ id: 3, name: "PagerDuty", value: "pager_duty" },
	{ id: 4, name: "Webhook", value: "webhook" },
	{ id: 5, name: "Discord", value: "discord" },
	{ id: 6, name: "Matrix", value: "matrix" },
];

export const TITLE_MAP = {
	email: "createNotifications.emailSettings.title",
	slack: "createNotifications.slackSettings.title",
	pager_duty: "createNotifications.pagerdutySettings.title",
	webhook: "createNotifications.webhookSettings.title",
	discord: "createNotifications.discordSettings.title",
	matrix: "createNotifications.matrixSettings.title",
};

export const DESCRIPTION_MAP = {
	email: "createNotifications.emailSettings.description",
	slack: "createNotifications.slackSettings.description",
	pager_duty: "createNotifications.pagerdutySettings.description",
	webhook: "createNotifications.webhookSettings.description",
	discord: "createNotifications.discordSettings.description",
	matrix: "createNotifications.matrixSettings.description",
};

export const LABEL_MAP = {
	email: "createNotifications.emailSettings.emailLabel",
	slack: "createNotifications.slackSettings.webhookLabel",
	pager_duty: "createNotifications.pagerdutySettings.integrationKeyLabel",
	webhook: "createNotifications.webhookSettings.webhookLabel",
	discord: "createNotifications.discordSettings.webhookLabel",
	matrix: "createNotifications.matrixSettings.homeserverLabel",
};

export const PLACEHOLDER_MAP = {
	email: "createNotifications.emailSettings.emailPlaceholder",
	slack: "createNotifications.slackSettings.webhookPlaceholder",
	pager_duty: "createNotifications.pagerdutySettings.integrationKeyPlaceholder",
	webhook: "createNotifications.webhookSettings.webhookPlaceholder",
	discord: "createNotifications.discordSettings.webhookPlaceholder",
	matrix: "createNotifications.matrixSettings.homeserverPlaceholder",
};
