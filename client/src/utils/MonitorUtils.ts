import type { MonitorStatus } from "@/types/monitor";
import type { IMonitor, MonitorType } from "@/types/monitor";
import type { PaletteKey } from "@/theme/theme";
import type { ValueType } from "@/components/design-elements/StatusLabel";

export const getMonitorPath = (type: MonitorType): string => {
  const pathMap: Record<MonitorType, string> = {
    http: "uptime",
    https: "uptime",
    port: "uptime",
    ping: "uptime",
    infrastructure: "infrastructure",
    pagespeed: "pagespeed",
  };
  return pathMap[type];
};

export const getStatusPalette = (status: MonitorStatus): PaletteKey => {
  const paletteMap: Record<MonitorStatus, PaletteKey> = {
    up: "success",
    down: "error",
    paused: "warning",
    initializing: "warning",
    resuming: "warning",
  };
  return paletteMap[status];
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
  const statusColors: Record<MonitorStatus, string> = {
    up: theme.palette.success.light,
    down: theme.palette.error.light,
    paused: theme.palette.warning.light,
    initializing: theme.palette.warning.light,
    resuming: theme.palette.warning.light,
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

export interface IStatusPageHeaderConfig {
  paletteKey: PaletteKey;
  message: string;
}
export const getStatusPageHeaderConfig = (
  monitors: IMonitor[],
  t: any
): IStatusPageHeaderConfig => {
  if (!monitors || monitors.length === 0) {
    return { paletteKey: "error", message: "No monitors available" };
  }

  const allUp = monitors.every((monitor) => monitor.status === "up");
  const anyDown = monitors.some((monitor) => monitor.status === "down");
  const allDown = monitors.every((monitor) => monitor.status === "down");

  if (allUp)
    return {
      paletteKey: "success",
      message: t("statusPage.details.statusHeader.allUp"),
    };
  if (allDown)
    return {
      paletteKey: "error",
      message: t("statusPage.details.statusHeader.allDown"),
    };
  if (anyDown)
    return {
      paletteKey: "warning",
      message: t("statusPage.details.statusHeader.anyDown"),
    };
  return {
    paletteKey: "warning",
    message: t("statusPage.details.statusHeader.anyDown"),
  };
};
