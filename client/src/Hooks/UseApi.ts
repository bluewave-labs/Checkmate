import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import type { AxiosRequestConfig } from "axios";
import { get, post, patch, deleteOp } from "@/Utils/ApiClient";

interface ApiResponse<T> {
	success: boolean;
	msg: string;
	data: T;
}

interface UseGetReturn<T> {
	data: T | undefined;
	isLoading: boolean;
	error: Error | undefined;
	refetch: () => Promise<ApiResponse<T> | undefined>;
}

const fetcher = async <T>(url: string, config?: AxiosRequestConfig) => {
	const res = await get<T>(url, config);
	return res.data;
};

export const useGet = <T>(
	url: string | null,
	axiosConfig?: AxiosRequestConfig,
	swrConfig?: SWRConfiguration
): UseGetReturn<T> => {
	const { data, error, isLoading, mutate } = useSWR<ApiResponse<T>>(
		url,
		(url: string) => fetcher<T>(url, axiosConfig),
		swrConfig
	);

	return {
		data: data?.data,
		isLoading,
		error,
		refetch: mutate,
	};
};
