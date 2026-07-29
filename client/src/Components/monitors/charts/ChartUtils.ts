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

export const PHASE_LABELS: Record<(typeof PHASE_KEYS)[number], string> = {
	avgDns: "DNS",
	avgTcp: "TCP",
	avgTls: "TLS",
	avgRequest: "Request",
	avgFirstByte: "First byte",
	avgDownload: "Download",
};
