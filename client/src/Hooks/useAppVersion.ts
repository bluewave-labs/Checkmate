import { useGet } from "@/Hooks/UseApi";

export interface AppVersionInfo {
	current: string;
	latest: string | null;
	updateAvailable: boolean;
	releaseUrl: string | null;
}

/**
 * The server caches the upstream lookup for hours, so revalidating on focus or
 * reconnect would only add requests that return the same cached answer.
 */
export const useAppVersion = () => {
	const { data, isLoading, error } = useGet<AppVersionInfo>("/app-version", undefined, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		shouldRetryOnError: false,
	});

	return { versionInfo: data, isLoading, error };
};
