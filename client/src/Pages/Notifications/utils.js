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
	{ value: "none", label: "None" },
	{ value: "username_password", label: "Username/Password" },
	{ value: "bearer_token", label: "Bearer Token" }
];

export const NTFY_PRIORITIES = [
	{ value: 1, label: "Min" },
	{ value: 2, label: "Low" },
	{ value: 3, label: "Default" },
	{ value: 4, label: "High" },
	{ value: 5, label: "Urgent" }
];
