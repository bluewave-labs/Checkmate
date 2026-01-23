import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import type { AxiosRequestConfig } from "axios";
import { get } from "@/Utils/ApiClient";

interface ApiResponse<T> {
	success: boolean;
	msg: string;
	data: T;
}

const fetcher = async <T>(url: string, config?: AxiosRequestConfig) => {
	const res = await get<ApiResponse<T>>(url, config);
	return res.data;
};

export const useGet = <T>(
	url: string | null,
	axiosConfig?: AxiosRequestConfig,
	swrConfig?: SWRConfiguration
) => {
	const { data, error, isLoading, mutate } = useSWR<ApiResponse<T>>(
		url,
		(url: string) => fetcher<T>(url, axiosConfig),
		swrConfig
	);

	return {
		data: data?.data ?? null,
		isLoading,
		error,
		refetch: mutate,
	};
};
