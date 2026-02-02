import { useMemo } from "react";
import { statusPageSchema, type StatusPageFormData } from "@/Validation/statusPage";
import type { StatusPage } from "@/Types/StatusPage";

interface UseStatusPageFormOptions {
	data?: StatusPage | null;
}

const generateDefaultUrl = () => Math.floor(Math.random() * 1000000).toString();

export const useStatusPageForm = ({ data = null }: UseStatusPageFormOptions = {}) => {
	return useMemo(() => {
		const defaults: StatusPageFormData = {
			companyName: data?.companyName || "",
			url: data?.url || generateDefaultUrl(),
			timezone: data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
			color: data?.color || "#4169E1",
			monitors: data?.monitors || [],
			isPublished: data?.isPublished ?? false,
			showCharts: data?.showCharts ?? true,
			showUptimePercentage: data?.showUptimePercentage ?? true,
			showAdminLoginLink: data?.showAdminLoginLink ?? false,
			customCSS: data?.customCSS || "",
			logo: data?.logo || null,
		};

		return { schema: statusPageSchema, defaults };
	}, [data]);
};
