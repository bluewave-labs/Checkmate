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

export const AREA_COLORS = [
	// Blues
	"#3182bd", // Deep blue
	"#6baed6", // Medium blue
	"#9ecae1", // Light blue

	// Greens
	"#74c476", // Soft green
	"#a1d99b", // Light green
	"#c7e9c0", // Pale green

	// Oranges
	"#fdae6b", // Warm orange
	"#fdd0a2", // Light orange
	"#feedde", // Pale orange

	// Purples
	"#9467bd", // Lavender
	"#a55194", // Deep magenta
	"#c994c7", // Soft magenta

	// Reds
	"#ff9896", // Soft red
	"#de2d26", // Deep red
	"#fc9272", // Medium red

	// Cyans/Teals
	"#17becf", // Cyan
	"#7fcdbb", // Teal
	"#a1dab4", // Light teal

	// Yellows
	"#fec44f", // Mustard
	"#fee391", // Light yellow
	"#ffffd4", // Pale yellow

	// Additional colors
	"#e377c2", // Soft pink
	"#bcbd22", // Olive
	"#2ca02c", // Vibrant green
];

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
