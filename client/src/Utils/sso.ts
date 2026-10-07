import { BASE_URL } from "@/Utils/ApiClient";

// Shape of GET /auth/sso.
export type SsoConfig = {
	enabled: boolean;
	label: string;
	localLoginDisabled: boolean;
};

// A full page navigation, not an axios call: the browser has to follow the redirect to the
// identity provider, so this cannot go through ApiClient.
export const ssoStartUrl = (): string => `${BASE_URL.replace(/\/$/, "")}/auth/sso/start`;
