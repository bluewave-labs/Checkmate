import { runtimeConfig } from "@/Utils/runtimeConfig";

// Shape of GET /auth/sso. Unauthenticated, so it carries only what the login page needs to decide
// whether to offer the button.
export type SsoConfig = {
	enabled: boolean;
	label: string;
	localLoginDisabled: boolean;
};

const API_BASE_URL =
	runtimeConfig.apiBaseUrl || import.meta.env.VITE_APP_API_BASE_URL || "/api/v1";

// A full page navigation, not an axios call: the browser has to follow the redirect to the
// identity provider, so this cannot go through ApiClient.
export const ssoStartUrl = (): string =>
	`${API_BASE_URL.replace(/\/$/, "")}/auth/sso/start`;
