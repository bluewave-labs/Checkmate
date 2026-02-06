import type { CheckHostInfo } from "@/Types/Check";

export const getFrequency = (frequency: number | undefined): string => {
	if (!frequency) return "N/A";
	const ghz = (frequency / 1000).toFixed(2);
	return `${ghz} GHz`;
};

export const getCores = (cores: number | undefined) => {
	if (!cores) return "N/A";
	if (cores === 1) return `${cores} core`;
	return `${cores} cores`;
};

export const getAvgTemp = (temps: number[]): string => {
	if (!temps || temps.length === 0) return "N/A";
	const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
	return `${avgTemp?.toFixed(2)} °C`;
};

export const getOsAndPlatform = (hostInfo: CheckHostInfo | undefined): string => {
	if (!hostInfo) {
		return "N/A";
	}
	const os = hostInfo?.pretty_name || hostInfo?.os || "N/A";
	const platform = hostInfo?.platform || "N/A";
	return `${os} (${platform})`;
};
