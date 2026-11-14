import { CHART_SERIES } from "@/Utils/Theme/Palette";

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

// VerifyWise chart series in their fixed order. Repeated so every index the
// previous 24-colour list covered still resolves to a colour.
export const AREA_COLORS: string[] = Array.from(
	{ length: 24 },
	(_, i) => CHART_SERIES[i % CHART_SERIES.length]
);

export const createGradient = ({
	id,
	startColor,
	endColor,
	startOpacity = 0.8,
	endOpacity = 0,
	direction = "vertical",
}: {
	id: string;
	startColor: string;
	endColor: string;
	startOpacity?: number;
	endOpacity?: number;
	direction?: "vertical" | "horizontal";
}) => (
	<defs>
		<linearGradient
			id={id}
			x1={direction === "vertical" ? "0" : "0"}
			y1={direction === "vertical" ? "0" : "0"}
			x2={direction === "vertical" ? "0" : "1"}
			y2={direction === "vertical" ? "1" : "0"}
		>
			<stop
				offset="0%"
				stopColor={startColor}
				stopOpacity={startOpacity}
			/>
			<stop
				offset="100%"
				stopColor={endColor}
				stopOpacity={endOpacity}
			/>
		</linearGradient>
	</defs>
);
