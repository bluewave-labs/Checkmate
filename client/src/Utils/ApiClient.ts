import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
const BASE_URL = import.meta.env.VITE_APP_API_V2_BASE_URL;

const api = axios.create({
	baseURL: BASE_URL || "http://localhost:55555/api/v2",
	withCredentials: true,
});

export const get = <T>(
	url: string,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.get<T>(url, config);

export const post = <T>(
	url: string,
	data: any,
	config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.post<T>(url, data, config);

export default api;
