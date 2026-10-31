import type { Got } from "got";
import type { AppVersionInfo } from "@/domain/app-version/app-version.type.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { timeRequest } from "@/service/networkProviders/utils.js";
import { APP_VERSION } from "@/utils/appVersion.js";

const SERVICE_NAME = "AppVersionService";
const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const RELEASES_URL = "https://api.github.com/repos/bluewave-labs/checkmate/releases/latest";

type GithubRelease = {
	tag_name?: string;
	html_url?: string;
	draft?: boolean;
	prerelease?: boolean;
};

// Null for anything that is not a plain three-part version, so release
// candidates and date tags are never compared numerically.
const parseVersion = (version: string): [number, number, number] | null => {
	const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
};

// Compared part by part: a string comparison puts 3.9.0 above 3.10.0.
export const isNewerVersion = (latest: string, current: string): boolean => {
	const latestParts = parseVersion(latest);
	const currentParts = parseVersion(current);
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
	private cache: { value: AppVersionInfo; expiresAt: number } | null = null;

	constructor(
		private got: Got,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	// A failed lookup is cached too, so an unreachable network costs one
	// request per TTL rather than one per page load.
	getVersionInfo = async (): Promise<AppVersionInfo> => {
		if (this.cache && this.cache.expiresAt > Date.now()) return this.cache.value;

		const latest = await this.fetchLatestRelease();
		const info: AppVersionInfo = {
			current: APP_VERSION,
			latest: latest?.version ?? null,
			updateAvailable: latest ? isNewerVersion(latest.version, APP_VERSION) : false,
			releaseUrl: latest?.url ?? null,
		};
		this.cache = { value: info, expiresAt: Date.now() + CACHE_TTL_MS };
		return info;
	};

	private fetchLatestRelease = async (): Promise<{ version: string; url: string | null } | null> => {
		try {
			let timer: NodeJS.Timeout | undefined;
			const { response, error } = await timeRequest(() =>
				Promise.race([
					this.got.get(RELEASES_URL, {
						headers: { "user-agent": `Checkmate/${APP_VERSION}` },
						responseType: "json",
						retry: { limit: 0 },
					}),
					new Promise<never>((_, reject) => {
						timer = setTimeout(() => reject(new Error(`Version check timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
					}),
				]).finally(() => clearTimeout(timer))
			);

			if (error || !response) {
				this.logger.debug({ err: error }, "Version check failed");
				return null;
			}

			const release = response.body as GithubRelease;
			if (!release?.tag_name || release.draft || release.prerelease) return null;
			return { version: release.tag_name, url: release.html_url ?? null };
		} catch (error: unknown) {
			this.logger.debug({ err: error }, "Version check failed");
			return null;
		}
	};
}
