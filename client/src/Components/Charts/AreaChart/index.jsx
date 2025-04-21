/**
 * CustomAreaChart component for rendering an area chart with optional gradient and custom ticks.
 *
 * @param {Object} props - The properties object.
 * @param {Array} props.data - The data array for the chart.
 * @param {Array} props.dataKeys - An array of data keys to be plotted as separate areas.
 * @param {string} props.xKey - The key for the x-axis data.
 * @param {string} [props.yKey] - The key for the y-axis data (optional).
 * @param {Object} [props.xTick] - Custom tick component for the x-axis.
 * @param {Object} [props.yTick] - Custom tick component for the y-axis.
 * @param {string} [props.strokeColor] - The base stroke color for the areas.
 *                                       If not provided, uses a predefined color palette.
 * @param {string} [props.fillColor] - The base fill color for the areas.
 * @param {boolean} [props.gradient=false] - Whether to apply a gradient fill to the areas.
 * @param {string} [props.gradientDirection="vertical"] - The direction of the gradient.
 * @param {string} [props.gradientStartColor] - The start color of the gradient.
 *                                              Defaults to the area's stroke color if not provided.
 * @param {string} [props.gradientEndColor] - The end color of the gradient.
 * @param {Object} [props.customTooltip] - Custom tooltip component for the chart.
 * @param {string|number} [props.height="100%"] - Height of the chart container.
 *
 * @returns {JSX.Element} The rendered area chart component.
 *
 * @example
 * // Single series chart
 * <CustomAreaChart
 *   data={temperatureData}
 *   dataKeys={["temperature"]}
 *   xKey="date"
 *   yKey="temperature"
 *   gradient={true}
 *   gradientStartColor="#ff6b6b"
 *   gradientEndColor="#4ecdc4"
 * />
 *
 * @example
 * // Multi-series chart with custom tooltip
 * <CustomAreaChart
 *   data={performanceData}
 *   dataKeys={["cpu.usage", "memory.usage"]}
 *   xKey="timestamp"
 *   xTick={<CustomTimeTick />}
 *   yTick={<PercentageTick />}
 *   gradient={true}
 *   customTooltip={({ active, payload, label }) => (
 *     <CustomTooltip
 *       label={label}
 *       payload={payload}
 *       active={active}
 *     />
 *   )}
 * />
 */

import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { createGradient } from "../Utils/gradientUtils";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material";
import { useId } from "react";
import { Fragment } from "react";

const CustomAreaChart = ({
	data,
	dataKeys,
	xKey,
	xDomain,
	yKey,
	yDomain,
	xTick,
	yTick,
	strokeColor,
	fillColor,
	gradient = false,
	gradientDirection = "vertical",
	gradientStartColor,
	gradientEndColor,
	customTooltip,
	height = "100%",
}) => {
	const theme = useTheme();
	const uniqueId = useId();

	const AREA_COLORS = [
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

	return (
		<ResponsiveContainer
			width="100%"
			height={height}
			// FE team HELP!  Why does this overflow if set to 100%?
		>
			<AreaChart data={data}>
				<XAxis
					dataKey={xKey}
					{...(xDomain && { domain: xDomain })}
					{...(xTick && { tick: xTick })}
				/>
				<YAxis
					dataKey={yKey}
					{...(yDomain && { domain: yDomain })}
					{...(yTick && { tick: yTick })}
				/>

				<CartesianGrid
					stroke={theme.palette.primary.lowContrast}
					strokeWidth={1}
					strokeOpacity={1}
					fill="transparent"
					vertical={false}
				/>
				{dataKeys.map((dataKey, index) => {
					const gradientId = `gradient-${uniqueId}-${index}`;

					return (
						<Fragment key={dataKey}>
							{gradient === true &&
								createGradient({
									id: gradientId,
									startColor: gradientStartColor || AREA_COLORS[index],
									endColor: gradientEndColor,
									direction: gradientDirection,
								})}
							<Area
								yKey={dataKey}
								key={dataKey}
								type="monotone"
								dataKey={dataKey}
								stroke={strokeColor || AREA_COLORS[index]}
								fill={gradient === true ? `url(#${gradientId})` : fillColor}
							/>
						</Fragment>
					);
				})}
				{customTooltip ? (
					<Tooltip
						cursor={{ stroke: theme.palette.primary.lowContrast }}
						content={customTooltip}
						wrapperStyle={{ pointerEvents: "none" }}
					/>
				) : (
					<Tooltip />
				)}
			</AreaChart>
		</ResponsiveContainer>
	);
};

CustomAreaChart.propTypes = {
	data: PropTypes.array.isRequired,
	dataKeys: PropTypes.array.isRequired,
	xTick: PropTypes.object, // Recharts takes an instance of component, so we can't pass the component itself
	yTick: PropTypes.object, // Recharts takes an instance of component, so we can't pass the component itself
	xKey: PropTypes.string.isRequired,
	xDomain: PropTypes.array,
	yKey: PropTypes.string,
	yDomain: PropTypes.array,
	fillColor: PropTypes.string,
	strokeColor: PropTypes.string,
	gradient: PropTypes.bool,
	gradientDirection: PropTypes.string,
	gradientStartColor: PropTypes.string,
	gradientEndColor: PropTypes.string,
	customTooltip: PropTypes.object,
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CustomAreaChart;
