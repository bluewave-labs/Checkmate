import type { MonitorStatus } from "@/Types/Monitor";
import type { PaletteKey } from "@/Utils/Theme/v2/theme";
export const getStatusPalette = (status: MonitorStatus): PaletteKey => {
	const paletteMap: Record<MonitorStatus, PaletteKey> = {
		up: "success",
		down: "error",
		initializing: "warning",
	};
	return paletteMap[status];
};

export const getStatusColor = (status: MonitorStatus, theme: any): string => {
	const statusColors: Record<MonitorStatus, string> = {
		up: theme.palette.success.lowContrast,
		down: theme.palette.error.lowContrast,
		initializing: theme.palette.warning.lowContrast,
	};
	return statusColors[status];
};

export const getResponseTimeColor = (responseTime: number): PaletteKey => {
	if (responseTime < 200) {
		return "success";
	} else if (responseTime < 300) {
		return "warning";
	} else {
		return "error";
	}
};

export const formatUrl = (url: string, maxLength: number = 55) => {
	if (!url) return "";

	const strippedUrl = url.replace(/^https?:\/\//, "");
	return strippedUrl.length > maxLength
		? `${strippedUrl.slice(0, maxLength)}…`
		: strippedUrl;
};
