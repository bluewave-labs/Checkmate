import { useGet } from "@/Hooks/UseApi";

// sessionStorage key holding the login state between /sso/start and the callback page
export const SSO_STATE_KEY = "checkmate.sso.state";

export const SsoProviders = ["entra", "google"] as const;
export type SsoProvider = (typeof SsoProviders)[number];

export interface SsoStatus {
	enabled: boolean;
	provider: SsoProvider | null;
	label: string;
	enforce: boolean;
}

export const useSsoStatus = () => {
	const { data, isLoading } = useGet<SsoStatus>("/sso/status", undefined, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		shouldRetryOnError: false,
	});

	return { status: data, isLoading };
};
