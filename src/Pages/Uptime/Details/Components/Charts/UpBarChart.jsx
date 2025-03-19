import { memo, useState } from "react";
import { useTheme } from "@mui/material";
import { ResponsiveContainer, BarChart, XAxis, Bar, Cell } from "recharts";
import PropTypes from "prop-types";
import CustomLabels from "./CustomLabels";

const getThemeColor = (responseTime) => {
	if (responseTime < 200) {
		return "success";
	} else if (responseTime < 300) {
		return "warning";
	} else {
		return "error";
	}
};

const UpBarChart = memo(({ groupedUpChecks = [], type, onBarHover }) => {
	const theme = useTheme();
	const [chartHovered, setChartHovered] = useState(false);
	const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

	return (
		<ResponsiveContainer
			width="100%"
			minWidth={210}
			height={155}
		>
			<BarChart
				width="100%"
				height="100%"
				data={groupedUpChecks}
				onMouseEnter={() => {
					setChartHovered(true);
					onBarHover({ time: null, totalChecks: 0, originalAvgResponseTime: 0 });
				}}
				onMouseLeave={() => {
					setChartHovered(false);
					setHoveredBarIndex(null);
					onBarHover(null);
				}}
			>
				<XAxis
					stroke={theme.palette.primary.lowContrast}
					height={15}
					tick={false}
					label={
						<CustomLabels
							x={0}
							y={0}
							width="100%"
							height="100%"
							firstDataPoint={groupedUpChecks?.[0]}
							lastDataPoint={groupedUpChecks?.[groupedUpChecks?.length - 1]}
							type={type}
						/>
					}
				/>
				<Bar
					dataKey="avgResponseTime"
					maxBarSize={7}
					background={{ fill: "transparent" }}
				>
					{groupedUpChecks?.map((entry, index) => {
						const themeColor = getThemeColor(entry.originalAvgResponseTime);
						return (
							<Cell
								key={`cell-${entry.time}`}
								fill={
									hoveredBarIndex === index
										? theme.palette[themeColor].main
										: chartHovered
											? theme.palette[themeColor].light
											: theme.palette[themeColor].main
								}
								onMouseEnter={() => {
									setHoveredBarIndex(index);
									onBarHover(entry);
								}}
								onMouseLeave={() => {
									setHoveredBarIndex(null);
									onBarHover({
										time: null,
										totalChecks: 0,
										groupUptimePercentage: 0,
									});
								}}
							/>
						);
					})}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
});

// Add display name for the component
UpBarChart.displayName = "UpBarChart";

// Validate props using PropTypes
UpBarChart.propTypes = {
	monitor: PropTypes.shape({
		groupedUpChecks: PropTypes.array,
	}),
	type: PropTypes.string,
	onBarHover: PropTypes.func,
};
export default UpBarChart;
