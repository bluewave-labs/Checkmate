export const DbTypes = ["mongodb"] as const;
export type DbType = (typeof DbTypes)[number];

export const QueueModes = ["primary", "worker"] as const;
export type QueueMode = (typeof QueueModes)[number];

export const LogLevels = ["error", "warn", "info", "debug"] as const;
export type LogLevel = (typeof LogLevels)[number];

// Rendered into GET /config.js as window.__CHECKMATE_CONFIG__; keys left unset
// fall back to the client's same-origin defaults.
export type ClientRuntimeConfig = {
	apiBaseUrl?: string;
	clientHost?: string;
	logLevel?: LogLevel;
};

export interface SettingsThresholds {
	cpu?: number;
	memory?: number;
	disk?: number;
	temperature?: number;
}

export type SettingsUpdate = {
	[K in keyof Settings]?: Settings[K] | null;
};

export interface Settings {
	id: string;
	checkTTL: number;
	language: string;
	jwtSecret?: string;
	pagespeedApiKey?: string;
	systemEmailHost?: string;
	systemEmailPort?: number;
	systemEmailAddress?: string;
	systemEmailDisplayName?: string;
	systemEmailPassword?: string;
	systemEmailUser?: string;
	systemEmailConnectionHost?: string;
	systemEmailTLSServername?: string;
	systemEmailSecure: boolean;
	systemEmailPool: boolean;
	systemEmailIgnoreTLS: boolean;
	systemEmailRequireTLS: boolean;
	systemEmailRejectUnauthorized: boolean;
	showURL: boolean;
	singleton: boolean;
	version: number;
	globalThresholds?: SettingsThresholds;
	createdAt: string;
	updatedAt: string;
}

export type EmailTransportConfig = Pick<
	Settings,
	| "systemEmailHost"
	| "systemEmailPort"
	| "systemEmailAddress"
	| "systemEmailDisplayName"
	| "systemEmailPassword"
	| "systemEmailUser"
	| "systemEmailConnectionHost"
	| "systemEmailTLSServername"
	| "systemEmailSecure"
	| "systemEmailPool"
	| "systemEmailIgnoreTLS"
	| "systemEmailRequireTLS"
	| "systemEmailRejectUnauthorized"
>;
