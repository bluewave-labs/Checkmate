import axios from "axios";
import type { AxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { store } from "@/store";
const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

const api = axios.create({
	baseURL: BASE_URL,
});

api.interceptors.request.use(
	(config) => {
		const authToken = store.getState().auth?.authToken ?? "";

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

const onSuccess = (response: AxiosResponse) => response;
const onError = (error: AxiosError) => {
	if (error.response?.status === 401) {
		window.location.href = "/login";
	}
	return Promise.reject(error);
};

api.interceptors.response.use(onSuccess, onError);

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

export const deleteOp = <T>(
	url: string,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.delete<T>(url, config);

export default api;
