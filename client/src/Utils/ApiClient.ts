import axios from "axios";
import type { AxiosError } from "axios";
import type {
	AxiosRequestConfig,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from "axios";
import { clearAuthState, setTokens } from "@/Features/Auth/authSlice";
import type { User } from "@/Types/User";
import { runtimeConfig } from "@/Utils/runtimeConfig";

export const BASE_URL =
	runtimeConfig.apiBaseUrl || import.meta.env.VITE_APP_API_BASE_URL || "/api/v1";

const api = axios.create({
	baseURL: BASE_URL,
});

type TokenPayload = { token: string; refreshToken: string; user: User };

type StoreType = {
	getState: () => { auth?: { authToken?: string; refreshToken?: string } };
	dispatch: (action: unknown) => unknown;
};

type RetryableConfig = InternalAxiosRequestConfig & {
	// Retried after a real refresh: a second 401 is final
	_ssoRetried?: boolean;
	// Retried with tokens another tab refreshed: a second 401 still gets one refresh
	_ssoAdopted?: boolean;
};

const LOGOUT_REFRESH_WAIT_MS = 3000;

const REFRESH_URL = "/sso/refresh";
const PERSIST_KEY = "persist:root";

let storeInstance: StoreType | null = null;
let interceptorsInitialized = false;

type ServerUnreachableCallback = (unreachable: boolean) => void;
let serverUnreachableCallback: ServerUnreachableCallback | null = null;

export const setServerUnreachableCallback = (
	callback: ServerUnreachableCallback
): void => {
	serverUnreachableCallback = callback;
};

let refreshPromise: Promise<TokenPayload> | null = null;

// Several tabs share one persisted refresh token and the server rotates it, so a
// tab with a stale token must pick up what another tab already refreshed.
const readPersistedAuth = (): TokenPayload | null => {
	try {
		const root = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? "null");
		const auth = JSON.parse(root?.auth ?? "null");
		if (auth?.authToken && auth?.refreshToken && auth?.user) {
			return { token: auth.authToken, refreshToken: auth.refreshToken, user: auth.user };
		}
	} catch {
		// Unreadable storage counts as no persisted session
	}
	return null;
};

const sentToken = (config: AxiosRequestConfig): string =>
	String(config.headers?.Authorization ?? "").replace("Bearer ", "");

// Revoke the server session on sign-out. If a refresh is in flight the server has
// already rotated the token we hold, so wait for it (bounded) and revoke the new one.
export const revokeSession = async (refreshToken: string): Promise<void> => {
	let token = refreshToken;
	if (refreshPromise) {
		const timeout = new Promise<null>((resolve) =>
			setTimeout(resolve, LOGOUT_REFRESH_WAIT_MS, null)
		);
		const rotated = await Promise.race([refreshPromise.catch(() => null), timeout]);
		token = rotated?.refreshToken ?? token;
	}
	await api.post("/sso/logout", { refreshToken: token }).catch(() => undefined);
};

export const initApiClient = (store: StoreType): void => {
	storeInstance = store;

	if (interceptorsInitialized) {
		return;
	}
	interceptorsInitialized = true;

	api.interceptors.request.use(
		(config) => {
			const authToken = storeInstance?.getState()?.auth?.authToken ?? "";

			config.headers.set("Authorization", `Bearer ${authToken}`);
			if (!config.headers.has("Accept-Language")) {
				config.headers.set("Accept-Language", "en");
			}

			return config;
		},
		(error) => {
			return Promise.reject(error);
		}
	);

	const onSuccess = (response: AxiosResponse) => {
		// Server is reachable, hide offline banner if shown
		serverUnreachableCallback?.(false);
		return response;
	};
	const adopt = (
		config: RetryableConfig,
		tokens: TokenPayload,
		error: AxiosError,
		flag: "_ssoRetried" | "_ssoAdopted"
	) => {
		// Signed out while the refresh was pending: don't bring the session back
		if (!storeInstance?.getState()?.auth?.refreshToken) {
			return Promise.reject(error);
		}
		storeInstance.dispatch(setTokens(tokens));
		config[flag] = true;
		config.headers.set("Authorization", `Bearer ${tokens.token}`);
		return api.request(config);
	};

	const redirectToLogin = (error: AxiosError) => {
		if (window.location.pathname !== "/login") {
			window.location.href = "/login";
		}
		return Promise.reject(error);
	};

	const giveUp = (error: AxiosError) => {
		storeInstance?.dispatch(clearAuthState());
		return redirectToLogin(error);
	};

	const handleUnauthorized = async (error: AxiosError) => {
		const config = error.config as RetryableConfig | undefined;
		const refreshToken = storeInstance?.getState()?.auth?.refreshToken ?? "";
		if (config?.url?.endsWith(REFRESH_URL)) {
			return Promise.reject(error);
		}
		if (!config || !refreshToken || config._ssoRetried) {
			return config?._ssoRetried ? giveUp(error) : redirectToLogin(error);
		}

		const persisted = readPersistedAuth();
		if (persisted && !config._ssoAdopted && persisted.token !== sentToken(config)) {
			return adopt(config, persisted, error, "_ssoAdopted");
		}

		refreshPromise ??= api
			.post<{ data: TokenPayload }>(REFRESH_URL, { refreshToken })
			.then((res) => res.data.data)
			.finally(() => {
				refreshPromise = null;
			});
		let tokens: TokenPayload;
		try {
			tokens = await refreshPromise;
		} catch (refreshError) {
			// Only a rejected session ends the login; outages and rate limits keep it
			if ((refreshError as AxiosError).response?.status !== 401) {
				return Promise.reject(error);
			}
			const latest = readPersistedAuth();
			if (latest && !config._ssoAdopted && latest.token !== sentToken(config)) {
				return adopt(config, latest, error, "_ssoAdopted");
			}
			return giveUp(error);
		}
		return adopt(config, tokens, error, "_ssoRetried");
	};

	const onError = (error: AxiosError) => {
		// Handle network errors (server unreachable)
		if (error.code === "ERR_NETWORK") {
			serverUnreachableCallback?.(true);
			return Promise.reject(error);
		}

		if (error.response?.status === 401) {
			return handleUnauthorized(error);
		}
		return Promise.reject(error);
	};

	api.interceptors.response.use(onSuccess, onError);
};

export const get = <T>(
	url: string,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.get<T>(url, config);

export const post = <T>(
	url: string,
	data: unknown,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.post<T>(url, data, config);

export const patch = <T>(
	url: string,
	data: unknown,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.patch<T>(url, data, config);

export const put = <T>(
	url: string,
	data: unknown,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.put<T>(url, data, config);

export const deleteOp = <T>(
	url: string,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.delete<T>(url, config);

export default api;
