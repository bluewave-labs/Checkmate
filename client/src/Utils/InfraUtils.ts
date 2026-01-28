import type { CheckDiskInfo, CheckHostInfo } from "@/Types/Check";

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
	console.log(temps);
	if (!temps || temps.length === 0) return "N/A";
	const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
	return `${avgTemp?.toFixed(2)} °C`;
};

export const getGbs = (bytes: number | undefined): string => {
	if (!bytes) {
		return "N/A";
	}
	if (bytes === 0) {
		return "0 GB";
	}

	const GB = bytes / (1024 * 1024 * 1024);
	const MB = bytes / (1024 * 1024);

	if (GB >= 1) {
		return GB.toFixed(2) + " GB";
	} else {
		return MB.toFixed(2) + " MB";
	}
};

export const getDiskTotalGbs = (disk?: Partial<CheckDiskInfo>[]): string => {
	if (!disk) {
		return getGbs(0);
	}
	const totalBytes = disk?.reduce((acc, disk) => acc + (disk.total_bytes || 0), 0) || 0;
	return getGbs(totalBytes);
};

export const getOsAndPlatform = (hostInfo: CheckHostInfo | undefined): string => {
	if (!hostInfo) {
		return "N/A";
	}
	const os = hostInfo?.pretty_name || hostInfo?.os || "N/A";
	const platform = hostInfo?.platform || "N/A";
	return `${os} (${platform})`;
};
