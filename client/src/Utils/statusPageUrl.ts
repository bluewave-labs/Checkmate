import { PUBLIC_STATUS_PAGE_PREFIX, type StatusPage } from "@/Types/StatusPage";

const CLIENT_HOST = import.meta.env.VITE_APP_CLIENT_HOST as string | undefined;

const getClientOriginProtocol = (): string => {
	const source =
		CLIENT_HOST || (typeof window !== "undefined" ? window.location.origin : undefined);
	if (!source) {
		return "https:";
	}

	try {
		return new URL(source).protocol;
	} catch {
		return "https:";
	}
};

const buildCustomDomainOrigin = (customDomain: string): string =>
	`${getClientOriginProtocol()}//${customDomain}`;

export const getAppHostname = (): string | null => {
	const source =
		CLIENT_HOST || (typeof window !== "undefined" ? window.location.origin : undefined);
	if (!source) {
		return null;
	}

	try {
		return new URL(source).hostname.toLowerCase();
	} catch {
		return null;
	}
};

export const isCustomDomainHost = (): boolean => {
	if (typeof window === "undefined") {
		return false;
	}

	const appHostname = getAppHostname();
	if (!appHostname) {
		return false;
	}

	return window.location.hostname.toLowerCase() !== appHostname;
};

export const getStatusPagePublicPath = (
	statusPage: Pick<StatusPage, "url" | "customDomain">
): string => {
	if (statusPage.customDomain) {
		return buildCustomDomainOrigin(statusPage.customDomain);
	}

	return `${PUBLIC_STATUS_PAGE_PREFIX}/${statusPage.url}`;
};

export const getStatusPagePublicUrl = (
	statusPage: Pick<StatusPage, "url" | "customDomain">
): string => {
	if (statusPage.customDomain) {
		return buildCustomDomainOrigin(statusPage.customDomain);
	}

	if (typeof window !== "undefined") {
		return `${window.location.origin}${PUBLIC_STATUS_PAGE_PREFIX}/${statusPage.url}`;
	}

	return `${PUBLIC_STATUS_PAGE_PREFIX}/${statusPage.url}`;
};

export const buildStatusPageApiPath = (options: {
	url?: string;
	useCustomDomain?: boolean;
}): string | null => {
	const query = "type=uptime&type=infrastructure";

	if (options.useCustomDomain && typeof window !== "undefined") {
		const domain = encodeURIComponent(window.location.hostname);
		return `/status-page/resolve?domain=${domain}&${query}`;
	}

	if (options.url) {
		return `/status-page/${options.url}?${query}`;
	}

	return null;
};
