import type { MonitorStatus } from "@/Types/Monitor";

export const getStatusColor = (status: MonitorStatus, theme: any): string => {
	const statusColors: Record<MonitorStatus, string> = {
		up: theme.palette.success.lowContrast,
		down: theme.palette.error.lowContrast,
		initializing: theme.palette.warning.lowContrast,
	};
	return statusColors[status];
};

export const formatUrl = (url: string, maxLength: number = 55) => {
	if (!url) return "";

	const strippedUrl = url.replace(/^https?:\/\//, "");
	return strippedUrl.length > maxLength
		? `${strippedUrl.slice(0, maxLength)}…`
		: strippedUrl;
};
