import { useState } from "react";
import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import type { AxiosRequestConfig } from "axios";
import { get, post, patch } from "@/Utils/v2/ApiClient"; // your axios wrapper

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
	const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
		url,
		(url) => fetcher<T>(url, axiosConfig),
		swrConfig
	);

	return {
		response: data ?? null,
		loading: isLoading,
		isValidating,
		error: error?.message ?? null,
		refetch: mutate,
	};
};

export const usePost = <B = any, R = any>() => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const postFn = async (
		endpoint: string,
		body: B,
		config?: AxiosRequestConfig
	): Promise<R | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await post<R>(endpoint, body, config);
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

export const usePatch = <B = any, R = any>() => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const patchFn = async (
		endpoint: string,
		body?: B,
		config?: AxiosRequestConfig
	): Promise<R | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await patch<R>(endpoint, body, config);
			return res.data;
		} catch (err: any) {
			const errMsg = err?.response?.data?.msg || err.message || "An error occurred";
			setError(errMsg);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { patch: patchFn, loading, error };
};
