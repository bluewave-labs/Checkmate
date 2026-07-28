import type { GroupedUptimeCheck } from "@/Types/Check";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer } from "recharts";

import { useTheme } from "@mui/material";

export const HistogramDetailsStacked = ({
	checks = [],
	range,
}: {
	checks: GroupedUptimeCheck[];
	range: string;
}) => {
	const theme = useTheme();

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
				<Area
					type="monotone"
					dataKey="avgResponseTime"
					stroke={theme.palette.primary.main}
					fill="url(#colorUv)"
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};
