import { memo, useState } from "react";
import { useTheme } from "@mui/material";
import { ResponsiveContainer, BarChart, XAxis, Bar, Cell } from "recharts";
import PropTypes from "prop-types";
import CustomLabels from "./CustomLabels";

const DownBarChart = memo(({ monitor, type, onBarHover }) => {
	const theme = useTheme();

	const [chartHovered, setChartHovered] = useState(false);
	const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

	return (
		<ResponsiveContainer
			width="100%"
			minWidth={250}
			height={155}
		>
			<BarChart
				width="100%"
				height="100%"
				data={monitor?.groupedDownChecks}
				onMouseEnter={() => {
					setChartHovered(true);
					onBarHover({ time: null, totalChecks: 0 });
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
							firstDataPoint={monitor?.groupedDownChecks?.[0] ?? {}}
							lastDataPoint={
								monitor?.groupedDownChecks?.[monitor?.groupedDownChecks?.length - 1] ?? {}
							}
							type={type}
						/>
					}
				/>
				<Bar
					dataKey="avgResponseTime"
					maxBarSize={7}
					background={{ fill: "transparent" }}
				>
					{monitor?.groupedDownChecks?.map((entry, index) => {
						return (
							<Cell
								key={`cell-${entry.time}`}
								fill={
									hoveredBarIndex === index
										? theme.palette.error.main
										: chartHovered
											? theme.palette.error.light // CAIO_REVIEW
											: theme.palette.error.main
								}
								onMouseEnter={() => {
									setHoveredBarIndex(index);
									onBarHover(entry);
								}}
								onMouseLeave={() => {
									setHoveredBarIndex(null);
									onBarHover({ time: null, totalChecks: 0 });
								}}
							/>
						);
					})}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
});

DownBarChart.displayName = "DownBarChart";
DownBarChart.propTypes = {
	monitor: PropTypes.shape({
		groupedDownChecks: PropTypes.arrayOf(PropTypes.object),
	}),
	type: PropTypes.string,
	onBarHover: PropTypes.func,
};
export default DownBarChart;
