import type { LogLevel } from "@/Types/Log";

// Served by GET /config.js (rendered from server env) or a static config.js
// next to index.html; loaded before the bundle in index.html.
export interface RuntimeConfig {
	apiBaseUrl?: string;
	clientHost?: string;
	logLevel?: LogLevel;
}

declare global {
	interface Window {
		__CHECKMATE_CONFIG__?: RuntimeConfig;
	}
}

export const runtimeConfig: RuntimeConfig =
	(typeof window !== "undefined" && window.__CHECKMATE_CONFIG__) || {};
