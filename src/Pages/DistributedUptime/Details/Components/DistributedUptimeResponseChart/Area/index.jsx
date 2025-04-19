import { useState } from "react";
import { useTheme } from "@emotion/react";
import {
	AreaChart,
	Area,
	XAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";
import CustomTick from "../Helpers/Tick";
import CustomToolTip from "../Helpers/ToolTip";
import PropTypes from "prop-types";

const DistributedUptimeResponseAreaChart = ({ checks }) => {
	const theme = useTheme();
	const [isHovered, setIsHovered] = useState(false);
	return (
		<ResponsiveContainer
			width="100%"
			minWidth={25}
			height={220}
		>
			<AreaChart
				width="100%"
				height="100%"
				data={checks}
				margin={{
					top: 10,
					right: 0,
					left: 0,
					bottom: 0,
				}}
				onMouseMove={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<CartesianGrid
					stroke={theme.palette.primary.lowContrast}
					strokeWidth={1}
					strokeOpacity={1}
					fill="transparent"
					vertical={false}
				/>
				<defs>
					<linearGradient
						id="colorUv"
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="0%"
							stopColor={theme.palette.accent.darker}
							stopOpacity={0.8}
						/>
						<stop
							offset="100%"
							stopColor={theme.palette.accent.main}
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<XAxis
					stroke={theme.palette.primary.lowContrast}
					dataKey="_id.date"
					tick={<CustomTick />}
					minTickGap={0}
					axisLine={false}
					tickLine={false}
					height={20}
				/>
				<Tooltip
					cursor={{ stroke: theme.palette.primary.lowContrast }}
					content={<CustomToolTip />}
					wrapperStyle={{ pointerEvents: "none" }}
				/>
				<Area
					type="monotone"
					dataKey="avgResponseTime"
					stroke={theme.palette.primary.accent}
					fill="url(#colorUv)"
					strokeWidth={isHovered ? 2.5 : 1.5}
					activeDot={{ stroke: theme.palette.background.main, r: 5 }}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};

DistributedUptimeResponseAreaChart.propTypes = {
	checks: PropTypes.array,
};

export default DistributedUptimeResponseAreaChart;
