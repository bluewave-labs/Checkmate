export const DbTypes = ["mongodb"] as const;
export type DbType = (typeof DbTypes)[number];

export const QueueModes = ["primary", "worker"] as const;
export type QueueMode = (typeof QueueModes)[number];

export const LogLevels = ["error", "warn", "info", "debug"] as const;
export type LogLevel = (typeof LogLevels)[number];
import type { z } from "zod";
import type { emailTransportConfigSchema, settingsSchema, settingsThresholdsSchema } from "./app-settings.schema.js";

// Rendered into GET /config.js as window.__CHECKMATE_CONFIG__; keys left unset
// fall back to the client's same-origin defaults.
export type ClientRuntimeConfig = {
	apiBaseUrl?: string;
	clientHost?: string;
	logLevel?: LogLevel;
};

export type SettingsUpdate = {
	[K in keyof Settings]?: Settings[K] | null;
};

export type SettingsThresholds = z.infer<typeof settingsThresholdsSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type EmailTransportConfig = z.infer<typeof emailTransportConfigSchema>;
