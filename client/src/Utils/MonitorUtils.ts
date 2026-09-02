import type { MonitorStatus, MonitorType } from "@/Types/Monitor";
import type { PaletteKey } from "@/Utils/Theme/Theme";
import type { ValueType } from "@/Components/design-elements/StatusLabel";
import type {
	DockerContainerMount,
	DockerContainerPort,
	DockerContainerState,
} from "@/Types/Check";

export const getMonitorPath = (type: MonitorType): string => {
	const pathMap: Record<MonitorType, string> = {
		http: "uptime",
		port: "uptime",
		ping: "uptime",
		game: "uptime",
		grpc: "uptime",
		websocket: "uptime",
		dns: "uptime",
		unknown: "uptime",
		docker: "docker",
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
	if (status === "breached") {
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

export const getDockerStatePalette = (state: DockerContainerState): PaletteKey => {
	const paletteMap: Record<DockerContainerState, PaletteKey> = {
		paused: "warning",
		created: "warning",
		running: "success",
		restarting: "warning",
		removing: "warning",
		exited: "error",
		dead: "error",
	};
	return paletteMap[state];
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

export const getUptimePercentageColor = (uptimePercentage: number): PaletteKey => {
	if (uptimePercentage >= 0.75) {
		return "success";
	} else if (uptimePercentage >= 0.5) {
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

export const dedupeDockerPorts = (
	ports: DockerContainerPort[]
): DockerContainerPort[] => {
	return ports.filter((port) => {
		// Discard ipv6 wildcards
		if (port.hostIp !== "::") return port;

		const isDuplicate = ports.some((otherPort) => {
			if (otherPort.hostIp !== "0.0.0.0") return false;

			return (
				otherPort.privatePort === port.privatePort &&
				otherPort.protocol === port.protocol &&
				otherPort.publicPort === port.publicPort
			);
		});
		return !isDuplicate;
	});
};

const isAnonymousVolumeName = (name: string): boolean => /^[0-9a-f]{64}$/.test(name);

export const getDockerMountLabel = (mount: DockerContainerMount) => {
	if (mount.type === "volume" && mount.name)
		return isAnonymousVolumeName(mount.name) ? mount.name.slice(0, 12) : mount.name;
	if (mount.source) return mount.source;
	return mount.type;
};
