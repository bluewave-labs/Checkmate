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
