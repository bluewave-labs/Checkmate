export type AppVersionInfo = {
	current: string;
	latest: string | null;
	updateAvailable: boolean;
	releaseUrl: string | null;
};
