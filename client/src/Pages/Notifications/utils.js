export const NOTIFICATION_TYPES = [
	{ _id: 1, name: "E-mail", value: "email" },
	{ _id: 2, name: "Slack", value: "slack" },
	{ _id: 3, name: "PagerDuty", value: "pager_duty" },
	{ _id: 4, name: "Webhook", value: "webhook" },
	{ _id: 5, name: "Discord", value: "discord" },
	{ _id: 6, name: "ntfy", value: "ntfy" },
];

export const TITLE_MAP = {
	email: "createNotifications.emailSettings.title",
	slack: "createNotifications.slackSettings.title",
	pager_duty: "createNotifications.pagerdutySettings.title",
	webhook: "createNotifications.webhookSettings.title",
	discord: "createNotifications.discordSettings.title",
	ntfy: "createNotifications.ntfySettings.title",
};

export const DESCRIPTION_MAP = {
	email: "createNotifications.emailSettings.description",
	slack: "createNotifications.slackSettings.description",
	pager_duty: "createNotifications.pagerdutySettings.description",
	webhook: "createNotifications.webhookSettings.description",
	discord: "createNotifications.discordSettings.description",
	ntfy: "createNotifications.ntfySettings.description",
};

export const LABEL_MAP = {
	email: "createNotifications.emailSettings.emailLabel",
	slack: "createNotifications.slackSettings.webhookLabel",
	pager_duty: "createNotifications.pagerdutySettings.integrationKeyLabel",
	webhook: "createNotifications.webhookSettings.webhookLabel",
	discord: "createNotifications.discordSettings.webhookLabel",
	ntfy: "createNotifications.ntfySettings.urlLabel",
};

export const PLACEHOLDER_MAP = {
	email: "createNotifications.emailSettings.emailPlaceholder",
	slack: "createNotifications.slackSettings.webhookPlaceholder",
	pager_duty: "createNotifications.pagerdutySettings.integrationKeyPlaceholder",
	webhook: "createNotifications.webhookSettings.webhookPlaceholder",
	discord: "createNotifications.discordSettings.webhookPlaceholder",
	ntfy: "createNotifications.ntfySettings.urlPlaceholder",
};

// ntfy-specific constants
export const NTFY_AUTH_METHODS = [
	{ _id: 1, name: "None", value: "none" },
	{ _id: 2, name: "Username/Password", value: "username_password" },
	{ _id: 3, name: "Bearer Token", value: "bearer_token" },
];

export const NTFY_PRIORITIES = [
	{ _id: 1, name: "Min", value: 1 },
	{ _id: 2, name: "Low", value: 2 },
	{ _id: 3, name: "Default", value: 3 },
	{ _id: 4, name: "High", value: 4 },
	{ _id: 5, name: "Urgent", value: 5 },
];
