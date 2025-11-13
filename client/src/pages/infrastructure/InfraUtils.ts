import type { IDiskInfo, IHostInfo } from "@/types/check";

export const getFrequency = (frequency: number): string => {
  if (!frequency) return "N/A";
  const ghz = (frequency / 1000).toFixed(2);
  return `${ghz} GHz`;
};

export const getCores = (cores: number) => {
  if (!cores) return "N/A";
  if (cores === 1) return `${cores} core`;
  return `${cores} cores`;
};

export const getAvgTemp = (temps: number[]): string => {
  if (!temps || temps.length === 0) return "N/A";
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  return `${avgTemp.toFixed(2)} °C`;
};

export const getGbs = (bytes: number): string => {
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

export const getDiskTotalGbs = (disk: IDiskInfo[]): string => {
  const totalBytes =
    disk?.reduce((acc, disk) => acc + (disk.total_bytes || 0), 0) || 0;
  return getGbs(totalBytes);
};

export const getOsAndPlatform = (hostInfo: IHostInfo): string => {
  const os = hostInfo?.pretty_name || hostInfo?.os || "N/A";
  const platform = hostInfo?.platform || "N/A";
  return `${os} (${platform})`;
};
