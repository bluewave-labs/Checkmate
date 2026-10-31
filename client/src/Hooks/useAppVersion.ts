import { useGet } from "@/Hooks/UseApi";

export interface AppVersionInfo {
	current: string;
	latest: string | null;
	updateAvailable: boolean;
	releaseUrl: string | null;
}

// The server caches the upstream lookup for hours, so revalidating would only
// repeat requests that return the same cached answer.
export const useAppVersion = () => {
	const { data } = useGet<AppVersionInfo>("/app-version", undefined, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		shouldRetryOnError: false,
	});

	return { versionInfo: data };
};
