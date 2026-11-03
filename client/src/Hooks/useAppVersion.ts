import { useGet } from "@/Hooks/UseApi";
import type { AppVersionInfo } from "@/Types/Settings";

export const useAppVersion = () => {
	const { data } = useGet<AppVersionInfo>("/app-version", undefined, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		shouldRetryOnError: false,
	});

	return { versionInfo: data };
};
