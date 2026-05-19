import axios from "axios";
import type { AxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

const api = axios.create({
	baseURL: BASE_URL,
	// Status-page unlock sets an httpOnly cookie; the follow-up status-page GET
	// must send it. Server CORS already returns Allow-Credentials: true.
	withCredentials: true,
});

type StoreType = {
	getState: () => { auth?: { authToken?: string } };
};

let storeInstance: StoreType | null = null;
let interceptorsInitialized = false;

type ServerUnreachableCallback = (unreachable: boolean) => void;
let serverUnreachableCallback: ServerUnreachableCallback | null = null;

export const setServerUnreachableCallback = (
	callback: ServerUnreachableCallback
): void => {
	serverUnreachableCallback = callback;
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
	const onError = (error: AxiosError) => {
		// Handle network errors (server unreachable)
		if (error.code === "ERR_NETWORK") {
			serverUnreachableCallback?.(true);
			return Promise.reject(error);
		}

		if (error.response?.status === 401) {
			// A 401 with `requiresPassword: true` signals an expected auth challenge
			// the component will handle (e.g. status-page lock screen) — skip the
			// session-expired redirect so the error propagates to the caller.
			const data = error.response.data as { requiresPassword?: boolean } | undefined;
			if (!data?.requiresPassword && window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
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
