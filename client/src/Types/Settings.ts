export interface SettingsThresholds {
	cpu?: number;
	memory?: number;
	disk?: number;
	temperature?: number;
}

export interface Settings {
	id: string;
	checkTTL: number;
	language: string;
	systemEmailHost?: string;
	systemEmailPort?: number;
	systemEmailAddress?: string;
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
	globalThresholds?: SettingsThresholds;
	createdAt: string;
	updatedAt: string;
}

export interface AppSettingsResponse {
	pagespeedKeySet: boolean;
	emailPasswordSet: boolean;
	settings: Settings;
}
