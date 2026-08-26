import { useMemo } from "react";
import { proxySchema, type ProxyFormData } from "@/Validation/proxy";
import type { ProxyResponse } from "@/Types/Proxy";

interface UseProxiesFormOptions {
	data?: ProxyResponse | null;
}

export const useProxiesForm = ({ data }: UseProxiesFormOptions) => {
	return useMemo(() => {
		const defaults: ProxyFormData = {
			name: data?.name ?? "",
			protocol: data?.protocol ?? "http",
			host: data?.host ?? "",
			port: data?.port ?? 8080,
			username: "",
			password: "",
		};

		return { schema: proxySchema, defaults };
	}, [data]);
};
