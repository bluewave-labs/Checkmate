import axios from "axios";
import type { AxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { config } from "@/config";
const BASE_URL = config.API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

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
  data: any,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.post<T>(url, data, config);

export const patch = <T>(
  url: string,
  data: any,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.patch<T>(url, data, config);

export const deleteOp = <T>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> => api.delete<T>(url, config);

export default api;
