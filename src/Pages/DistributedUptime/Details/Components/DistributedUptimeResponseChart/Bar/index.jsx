import {
	BarChart,
	Bar,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
} from "recharts";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import CustomToolTip from "../Helpers/ToolTip";
import CustomTick from "../Helpers/Tick";

const DistributedUptimeResponseBarChart = ({ checks }) => {
	const theme = useTheme();
	return (
		<ResponsiveContainer
			width="100%"
			minWidth={25}
			height={220}
		>
			<BarChart
				width="100%"
				height="100%"
				data={checks}
				margin={{
					top: 10,
					right: 0,
					left: 0,
					bottom: 0,
				}}
			>
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
				<CartesianGrid
					stroke={theme.palette.primary.lowContrast}
					strokeWidth={1}
					strokeOpacity={1}
					fill="transparent"
					vertical={false}
				/>
				<Tooltip
					cursor={{
						stroke: theme.palette.primary.lowContrast,
						fill: "transparent",
					}}
					content={<CustomToolTip />}
					wrapperStyle={{ pointerEvents: "none" }}
				/>
				<XAxis
					stroke={theme.palette.primary.lowContrast}
					dataKey="_id.date"
					tick={<CustomTick />}
					minTickGap={0}
					axisLine={false}
					tickLine={false}
					height={20}
				/>
				<Bar
					maxBarSize={25}
					dataKey="avgResponseTime"
					fill="url(#colorUv)"
					activeBar={{
						stroke: theme.palette.accent.main,
						r: 5,
					}}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

DistributedUptimeResponseBarChart.propTypes = {
	checks: PropTypes.array,
};

export default DistributedUptimeResponseBarChart;
