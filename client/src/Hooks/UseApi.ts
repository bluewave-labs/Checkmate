import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import type { AxiosRequestConfig } from "axios";
import { get, patch, post, put, deleteOp } from "@/Utils/ApiClient";
import { useState } from "react";
import { useToast } from "@/Hooks/UseToast";

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
	const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<T>>(
		url,
		(url: string) => fetcher<T>(url, axiosConfig),
		swrConfig
	);

	return {
		data: data?.data ?? null,
		isLoading,
		isValidating,
		error,
		refetch: mutate,
	};
};

export const usePost = <B = any, R = any>() => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { toastError, toastSuccess } = useToast();

	const postFn = async (
		endpoint: string,
		body: B,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<R> | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await post<ApiResponse<R>>(endpoint, body, {
				...config,
				headers: {
					...config?.headers,
				},
			});
			toastSuccess(res.data?.msg || "Operation successful");

			return res.data;
		} catch (err: any) {
			const errMsg = err?.response?.data?.msg || err.message || "An error occurred";
			console.error(err);
			toastError(errMsg);
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
	const { toastError, toastSuccess } = useToast();

	const patchFn = async (
		endpoint: string,
		body?: B,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<R> | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await patch<ApiResponse<R>>(endpoint, body, {
				...config,
				headers: {
					...config?.headers,
				},
			});
			toastSuccess(res.data?.msg || "Operation successful");
			return res.data;
		} catch (err: any) {
			console.error(err);
			const errMsg = err?.response?.data?.msg || err.message || "An error occurred";
			toastError(errMsg);
			setError(errMsg);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { patch: patchFn, loading, error };
};

export const usePut = <B = any, R = any>() => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { toastError, toastSuccess } = useToast();

	const putFn = async (
		endpoint: string,
		body?: B,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<R> | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await put<ApiResponse<R>>(endpoint, body, {
				...config,
				headers: {
					...config?.headers,
				},
			});
			toastSuccess(res.data?.msg || "Operation successful");
			return res.data;
		} catch (err: any) {
			console.error(err);
			const errMsg = err?.response?.data?.msg || err.message || "An error occurred";
			toastError(errMsg);
			setError(errMsg);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { put: putFn, loading, error };
};

export const useDelete = <R = any>() => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { toastError, toastSuccess } = useToast();

	const deleteFn = async (
		endpoint: string,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<R> | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await deleteOp<ApiResponse<R>>(endpoint, {
				...config,
				headers: {
					...config?.headers,
				},
			});
			toastSuccess(res.data?.msg || "Operation successful");
			return res.data;
		} catch (err: any) {
			console.error(err);
			const errMsg = err?.response?.data?.message || err.message || "An error occurred";
			toastError(errMsg);
			setError(errMsg);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { deleteFn, loading, error };
};

export const useLazyGet = <R = any>() => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { toastError } = useToast();

	const getFn = async (
		endpoint: string,
		config?: AxiosRequestConfig
	): Promise<ApiResponse<R> | null> => {
		setLoading(true);
		setError(null);

		try {
			const res = await get<ApiResponse<R>>(endpoint, {
				...config,
				headers: {
					...config?.headers,
				},
			});
			return res.data;
		} catch (err: any) {
			console.error(err);
			const errMsg = err?.response?.data?.msg || err.message || "An error occurred";
			toastError(errMsg);
			setError(errMsg);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return { get: getFn, loading, error };
};
