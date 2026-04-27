import { useMemo } from "react";
import { statusPageSchema, type StatusPageFormData } from "@/Validation/statusPage";
import type { StatusPage } from "@/Types/StatusPage";
import type { Monitor } from "@/Types/Monitor";

interface UseStatusPageFormOptions {
	data?: StatusPage | null;
	monitors?: Monitor[] | null;
}

const generateDefaultUrl = () => Math.floor(Math.random() * 1000000).toString();

const transformLogo = (logo: StatusPage["logo"]): StatusPageFormData["logo"] => {
	if (!logo || !logo.data) return null;
	return {
		data: `data:${logo.contentType};base64,${logo.data}`,
		contentType: logo.contentType,
	};
};

export const useStatusPageForm = ({
	data = null,
	monitors = null,
}: UseStatusPageFormOptions = {}) => {
	return useMemo(() => {
		const defaults: StatusPageFormData = {
			companyName: data?.companyName || "",
			url: data?.url || generateDefaultUrl(),
			timezone: data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
			type: data?.type || ["uptime"],
			color: data?.color || "#4169E1",
			monitors: data?.monitors || [],
			isPublished: data?.isPublished ?? false,
			showCharts: data?.showCharts ?? true,
			showUptimePercentage: data?.showUptimePercentage ?? true,
			showAdminLoginLink: data?.showAdminLoginLink ?? false,
			showInfrastructure: data?.showInfrastructure ?? false,
			customCSS: data?.customCSS || "",
			logo: transformLogo(data?.logo),
		};

		return { schema: statusPageSchema, defaults };
	}, [data, monitors]);
};
