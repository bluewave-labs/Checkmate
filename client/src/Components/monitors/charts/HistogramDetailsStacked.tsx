import type { GroupedUptimeCheck } from "@/Types/Check";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, YAxis } from "recharts";

import { useMemo } from "react";
import { useTheme } from "@mui/material";

const PHASE_KEYS = [
	"avgDns",
	"avgTcp",
	"avgTls",
	"avgRequest",
	"avgFirstByte",
	"avgDownload",
] as const;

export const HistogramDetailsStacked = ({
	checks = [],
	range,
}: {
	checks: GroupedUptimeCheck[];
	range: string;
}) => {
	const theme = useTheme();

	// Cap the y-domain at the p95 of bucket totals so a single timeout bucket
	// doesn't flatten every other bucket; spikes clip off the top instead.
	const yMax = useMemo(() => {
		const totals = checks
			.map((check) => PHASE_KEYS.reduce((sum, key) => sum + check[key], 0))
			.sort((a, b) => a - b);
		if (totals.length < 2) return undefined;
		const p95 = totals[Math.min(totals.length - 1, Math.floor(totals.length * 0.95))];
		return p95 > 0 ? Math.ceil(p95) : undefined;
	}, [checks]);

	console.log(JSON.stringify(checks, null, 2));

	return (
		<ResponsiveContainer
			width="100%"
			height={300}
		>
			<AreaChart data={checks.slice()}>
				<CartesianGrid
					stroke={theme.palette.divider}
					strokeWidth={1}
					strokeOpacity={1}
					fill="transparent"
					vertical={false}
				/>
				<YAxis
					hide
					domain={[0, yMax ?? "auto"]}
					allowDataOverflow
				/>

				<Area
					type="monotone"
					stackId={1}
					dataKey="avgDns"
					stroke={"blue"}
					fill="blue"
				/>
				<Area
					stackId={1}
					type="monotone"
					dataKey="avgTcp"
					stroke={"red"}
					fill="red"
				/>
				<Area
					stackId={1}
					type="monotone"
					dataKey="avgTls"
					stroke={"green"}
					fill="green"
				/>
				<Area
					stackId={1}
					type="monotone"
					dataKey="avgRequest"
					stroke={"orange"}
					fill="orange"
				/>
				<Area
					stackId={1}
					type="monotone"
					dataKey="avgFirstByte"
					stroke={"purple"}
					fill="purple"
				/>

				<Area
					stackId={1}
					type="monotone"
					dataKey="avgDownload"
					stroke={"brown"}
					fill="brown"
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};
