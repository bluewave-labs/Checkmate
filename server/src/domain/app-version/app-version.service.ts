import type { Got } from "got";
import type { AppVersionInfo } from "@/domain/app-version/app-version.type.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { APP_VERSION } from "@/utils/appVersion.js";

const SERVICE_NAME = "AppVersionService";
const TIMEOUT_MS = 5000;
const SUCCESS_TTL_MS = 6 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 10 * 60 * 1000;
const RELEASES_URL = "https://api.github.com/repos/bluewave-labs/checkmate/releases/latest";
const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)$/;

const toParts = (version: string) => {
	const match = VERSION_PATTERN.exec(version);
	return match ? ([Number(match[1]), Number(match[2]), Number(match[3])] as const) : null;
};

export const isNewerVersion = (latest: string | null, current: string = APP_VERSION): boolean => {
	if (latest === null) return false;
	const latestParts = toParts(latest);
	const currentParts = toParts(current);
	if (!latestParts || !currentParts) return false;
	const [latestMajor, latestMinor, latestPatch] = latestParts;
	const [currentMajor, currentMinor, currentPatch] = currentParts;
	if (latestMajor !== currentMajor) return latestMajor > currentMajor;
	if (latestMinor !== currentMinor) return latestMinor > currentMinor;
	return latestPatch > currentPatch;
};

export interface IAppVersionService {
	getVersionInfo(): Promise<AppVersionInfo>;
}

export class AppVersionService implements IAppVersionService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private cache: { info: Promise<AppVersionInfo>; expiresAt: number } | null = null;

	constructor(
		private got: Got,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private lookupVersion = async () => {
		let latest: string | null = null;
		try {
			const body = await this.got
				.get(RELEASES_URL, {
					timeout: { request: TIMEOUT_MS },
					retry: { limit: 0 },
					headers: { accept: "application/vnd.github+json", "user-agent": `Checkmate/${APP_VERSION}` },
				})
				.json<{ tag_name?: unknown }>();
			latest = typeof body.tag_name === "string" ? body.tag_name : null;
		} catch (error: unknown) {
			this.logger.debug({ err: error }, "Version check failed");
		}

		// Check if there is a version diff
		return { latest, updateAvailable: isNewerVersion(latest) };
	};

	getVersionInfo = async (): Promise<AppVersionInfo> => {
		if (this.cache && this.cache.expiresAt > Date.now()) return this.cache.info;

		const entry = { info: this.lookupVersion(), expiresAt: Date.now() + SUCCESS_TTL_MS };
		this.cache = entry;

		const info = await entry.info;
		if (info.latest === null) {
			entry.expiresAt = Date.now() + FAILURE_TTL_MS;
		}
		return info;
	};
}
