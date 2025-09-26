import { useState } from "react";
import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import type { AxiosRequestConfig } from "axios";
import { get, post } from "@/Utils/ApiClient"; // your axios wrapper

export type ApiResponse = {
	message: string;
	data: any;
};

// Generic fetcher for GET requests
const fetcher = async <T,>(url: string, config?: AxiosRequestConfig) => {
	const res = await get<T>(url, config);
	return res.data;
};

export const useGet = <T,>(
	url: string,
	axiosConfig?: AxiosRequestConfig,
	swrConfig?: SWRConfiguration<T, Error>
) => {
	const { data, error, isLoading, mutate } = useSWR<T>(
		url,
		(url) => fetcher<T>(url, axiosConfig),
		swrConfig
	);

	return {
		response: data ?? null,
		loading: isLoading,
		error: error?.message ?? null,
		refetch: mutate,
	};
};

export const usePost = <B = any,>(endpoint: string) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const postFn = async (
		body: B,
		config?: AxiosRequestConfig
	): Promise<ApiResponse | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await post<ApiResponse>(endpoint, body, config);
			return res.data;
		} catch (err: any) {
			const errMsg = err?.response?.data?.msg || err.message || "An error occurred";
			setError(errMsg);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { post: postFn, loading, error };
};
