import { useState } from "react";
import useSWR from "swr";
import type { SWRConfiguration } from "swr";
import type { AxiosRequestConfig } from "axios";
import { get, post, patch, deleteOp } from "@/utils/ApiClient";
import { useAppSelector } from "@/hooks/AppHooks";
import { useToast } from "@/hooks//UseToast";

export type ApiResponse<T> = {
  message: string;
  data: T;
};

export interface IExtraConfig {
  useTeamIdAsKey?: boolean;
}

// Generic fetcher for GET requests
const fetcher = async <T,>(url: string, config?: AxiosRequestConfig) => {
  const res = await get<T>(url, config);
  return res.data;
};
export const useGet = <T,>(
  url: string,
  axiosConfig?: AxiosRequestConfig,
  swrConfig?: SWRConfiguration<T, Error>,
  extraConfig?: IExtraConfig
) => {
  const { toastError } = useToast();
  const currentTeamId = useAppSelector((state) => state.auth.selectedTeamId);
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    // Key
    extraConfig?.useTeamIdAsKey && currentTeamId ? [url, currentTeamId] : url,
    // Fetcher
    (key) => {
      // Fetcher receives the key as an argument
      const targetUrl = Array.isArray(key) ? key[0] : key;
      return fetcher<T>(targetUrl, {
        ...axiosConfig,
        headers: {
          ...axiosConfig?.headers,
          "x-team-id": currentTeamId,
        },
      });
    },
    // Config
    {
      onError: (err) => {
        console.log(err);
        toastError(
          err?.response?.data?.message ||
            err.message ||
            "An unexpected error occurred"
        );
      },
      ...swrConfig,
    }
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
  const currentTeamId = useAppSelector((state) => state.auth.selectedTeamId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toastError } = useToast();

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
          "x-team-id": currentTeamId,
        },
      });
      return res.data;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.msg || err.message || "An error occurred";
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
  const currentTeamId = useAppSelector((state) => state.auth.selectedTeamId);
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
          "x-team-id": currentTeamId,
        },
      });
      toastSuccess(res.data?.message || "Operation successful");
      return res.data;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.msg || err.message || "An error occurred";
      toastError(errMsg);
      setError(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { patch: patchFn, loading, error };
};

export const useDelete = <R = any,>() => {
  const currentTeamId = useAppSelector((state) => state.auth.selectedTeamId);
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
          "x-team-id": currentTeamId,
        },
      });
      toastSuccess(res.data?.message || "Operation successful");
      return res.data;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.msg || err.message || "An error occurred";
      toastError(errMsg);
      setError(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { deleteFn, loading, error };
};
