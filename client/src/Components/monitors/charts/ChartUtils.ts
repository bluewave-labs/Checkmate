export const computeYAxisCap = (values: number[]): number | undefined => {
	const sorted = values.slice().sort((a, b) => a - b);
	if (sorted.length < 2) return undefined;
	const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
	return p95 > 0 ? Math.ceil(p95 * 2) : undefined;
};

export const PHASE_KEYS = [
	"avgDns",
	"avgTcp",
	"avgTls",
	"avgRequest",
	"avgFirstByte",
	"avgDownload",
] as const;

export const PHASE_COLOR_KEYS = {
	avgDns: "dns",
	avgTcp: "tcp",
	avgTls: "tls",
	avgRequest: "request",
	avgFirstByte: "firstByte",
	avgDownload: "download",
} as const;

// i18n keys, resolved with t() at render
export const PHASE_LABEL_KEYS: Record<(typeof PHASE_KEYS)[number], string> = {
	avgDns: "common.charts.phases.dns",
	avgTcp: "common.charts.phases.tcp",
	avgTls: "common.charts.phases.tls",
	avgRequest: "common.charts.phases.request",
	avgFirstByte: "common.charts.phases.firstByte",
	avgDownload: "common.charts.phases.download",
};
