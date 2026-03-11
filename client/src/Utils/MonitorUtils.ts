import type { MonitorStatus, MonitorType } from "@/Types/Monitor";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import type { ValueType } from "@/Components/design-elements/StatusLabel";

export const getMonitorPath = (type: MonitorType): string => {
	const pathMap: Record<MonitorType, string> = {
		http: "uptime",
		port: "uptime",
		ping: "uptime",
		game: "uptime",
		grpc: "uptime",
		websocket: "uptime",
		unknown: "uptime",
		docker: "uptime",
		hardware: "infrastructure",
		pagespeed: "pagespeed",
	};
	return pathMap[type];
};

export const getStatusPalette = (status: MonitorStatus): PaletteKey => {
	if (status === "up") {
		return "success";
	}
	if (status === "down") {
		return "error";
	}
	if (status === "exceeded") {
		return "error";
	}
	return "warning";
};

export const getValuePalette = (value: ValueType): PaletteKey => {
	const paletteMap: Record<ValueType, PaletteKey> = {
		positive: "success",
		negative: "error",
		neutral: "warning",
	};
	return paletteMap[value];
};

export const getStatusColor = (status: MonitorStatus, theme: any): string => {
	if (status === "up") {
		return theme.palette.success.light;
	}

	if (status === "down") {
		return theme.palette.error.light;
	}

	return theme.palette.warning.light;
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

export const getInfraGaugeColor = (val: number, theme: any) => {
	if (val < 50) {
		return theme.palette.success.main;
	} else if (val < 80) {
		return theme.palette.warning.light;
	} else {
		return theme.palette.error.light;
	}
};

export const getPageSpeedPalette = (score: number): PaletteKey => {
	if (score >= 90) return "success";
	else if (score >= 50) return "warning";
	else return "error";
};

export const formatUrl = (url: string, maxLength: number = 55) => {
	if (!url) return "";

	const strippedUrl = url.replace(/^https?:\/\//, "");
	return strippedUrl.length > maxLength
		? `${strippedUrl.slice(0, maxLength)}…`
		: strippedUrl;
};
