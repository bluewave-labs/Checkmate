import PropTypes from "prop-types";
import {
	AreaChart,
	Area,
	XAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
	Text,
} from "recharts";
import { useTheme } from "@emotion/react";
import { useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { formatDateWithTz } from "../../../../../Utils/timeUtils";
import { useSelector } from "react-redux";

const config = {
	seo: {
		id: "seo",
		text: "SEO",
		color: "secondary",
	},
	performance: {
		id: "performance",
		text: "performance",
		color: "success",
	},
	bestPractices: {
		id: "bestPractices",
		text: "best practices",
		color: "warning",
	},
	accessibility: {
		id: "accessibility",
		text: "accessibility",
		color: "accent",
	},
};

/**
 * Custom tooltip for the area chart.
 * @param {Object} props
 * @param {boolean} props.active - Whether the tooltip is active.
 * @param {Array} props.payload - The payload data for the tooltip.
 * @param {string} props.label - The label for the tooltip.
 * @returns {JSX.Element|null} The tooltip element or null if not active.
 */

const CustomToolTip = ({ active, payload, label, config }) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state) => state.ui.timezone);

	if (active && payload && payload.length) {
		return (
			<Box
				sx={{
					backgroundColor: theme.palette.primary.main,
					border: 1,
					borderColor: theme.palette.primary.lowContrast,
					borderRadius: theme.shape.borderRadius,
					py: theme.spacing(2),
					px: theme.spacing(4),
				}}
			>
				<Typography
					sx={{
						color: theme.palette.primary.contrastTextTertiary,
						fontSize: 12,
						fontWeight: 500,
					}}
				>
					{formatDateWithTz(label, "ddd, MMMM D, YYYY, h:mm A", uiTimezone)}
				</Typography>
				{Object.keys(config)
					.reverse()
					.map((key) => {
						const { color } = config[key];
						const dotColor = theme.palette[color].main;

						return (
							<Stack
								key={`${key}-tooltip`}
								direction="row"
								alignItems="center"
								gap={theme.spacing(3)}
								mt={theme.spacing(1)}
								sx={{
									"& span": {
										color: theme.palette.primary.contrastTextTertiary,
										fontSize: 11,
										fontWeight: 500,
									},
								}}
							>
								<Box
									width={theme.spacing(4)}
									height={theme.spacing(4)}
									backgroundColor={dotColor}
									sx={{ borderRadius: "50%" }}
								/>
								<Typography
									component="span"
									textTransform="capitalize"
									sx={{ opacity: 0.8 }}
								>
									{config[key].text}
								</Typography>{" "}
								<Typography component="span">{payload[0].payload[key]}</Typography>
							</Stack>
						);
					})}
			</Box>
		);
	}
	return null;
};

CustomToolTip.propTypes = {
	active: PropTypes.bool,
	payload: PropTypes.array,
	label: PropTypes.string,
	config: PropTypes.object,
};

/**
 * Processes data to insert gaps with null values based on the interval.
 * @param {Array} data
 * @param {number} interval - The interval in milliseconds for gaps.
 * @returns {Array} The formatted data with gaps.
 */
const processDataWithGaps = (data, interval) => {
	if (data.length === 0) return [];
	let formattedData = [];
	let last = new Date(data[0].createdAt).getTime();

	// Helper function to add a null entry
	const addNullEntry = (timestamp) => {
		formattedData.push({
			accessibility: "N/A",
			bestPractices: "N/A",
			performance: "N/A",
			seo: "N/A",
			createdAt: timestamp,
		});
	};

	data.forEach((entry) => {
		const current = new Date(entry.createdAt).getTime();

		if (current - last > interval * 2) {
			// Insert null entries for each interval
			let temp = last + interval;
			while (temp < current) {
				addNullEntry(new Date(temp).toISOString());
				temp += interval;
			}
		}

		formattedData.push(entry);
		last = current;
	});

	return formattedData;
};

/**
 * Custom tick component to render ticks on the XAxis.
 *
 * @param {Object} props
 * @param {number} props.x - The x coordinate for the tick.
 * @param {number} props.y - The y coordinate for the tick.
 * @param {Object} props.payload - The data object containing the tick value.
 * @param {number} props.index - The index of the tick in the array of ticks.
 *
 * @returns {JSX.Element|null} The tick element or null if the tick should be hidden.
 */
const CustomTick = ({ x, y, payload, index }) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state) => state.ui.timezone);

	// Render nothing for the first tick
	if (index === 0) return null;

	return (
		<Text
			x={x}
			y={y + 8}
			textAnchor="middle"
			fill={theme.palette.primary.contrastTextTertiary}
			fontSize={11}
			fontWeight={400}
		>
			{formatDateWithTz(payload?.value, "h:mm a", uiTimezone)}
		</Text>
	);
};
CustomTick.propTypes = {
	x: PropTypes.number,
	y: PropTypes.number,
	payload: PropTypes.shape({
		value: PropTypes.string.isRequired,
	}),
	index: PropTypes.number,
};

/**
 * A chart displaying pagespeed details over time.
 * @param {Object} props
 * @param {Array} props.data - The data to display in the chart.
 * @param {number} props.interval - The interval in milliseconds for processing gaps.
 * @returns {JSX.Element} The area chart component.
 */

const PageSpeedAreaChart = ({ data, monitor, metrics }) => {
	const theme = useTheme();
	const [isHovered, setIsHovered] = useState(false);
	const memoizedData = useMemo(
		() => processDataWithGaps(data, monitor.interval),
		[data[0]]
	);

	const filteredConfig = Object.keys(config).reduce((result, key) => {
		if (metrics[key]) {
			result[key] = config[key];
		}
		return result;
	}, {});

	return (
		<ResponsiveContainer
			width="100%"
			minWidth={25}
			height={215}
		>
			<AreaChart
				width="100%"
				height="100%"
				data={memoizedData}
				margin={{ top: 10 }}
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
				<XAxis
					stroke={theme.palette.primary.lowContrast}
					dataKey="createdAt"
					tick={<CustomTick />}
					axisLine={false}
					tickLine={false}
					height={18}
					minTickGap={0}
					interval="equidistantPreserveStart"
				/>
				<Tooltip
					cursor={{ stroke: theme.palette.primary.lowContrast }}
					content={<CustomToolTip config={filteredConfig} />}
				/>
				<defs>
					{Object.values(filteredConfig).map(({ id, color }) => {
						/* TODO not working? */
						const startColor = theme.palette[color].main;
						const endColor = theme.palette[color].lowContrast;

						return (
							<linearGradient
								id={id}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
								key={id}
							>
								<stop
									offset="0%"
									stopColor={startColor}
									stopOpacity={0.8}
								/>
								<stop
									offset="100%"
									stopColor={endColor}
									stopOpacity={0}
								/>
							</linearGradient>
						);
					})}
				</defs>
				{Object.keys(filteredConfig).map((key) => {
					const { color } = filteredConfig[key];
					const strokeColor = theme.palette[color].main;
					const bgColor = theme.palette.primary.main;

					return (
						<Area
							connectNulls
							key={key}
							dataKey={key}
							stackId={1}
							stroke={strokeColor}
							strokeWidth={isHovered ? 2.5 : 1.5}
							fill={`url(#${filteredConfig[key].id})`}
							activeDot={{ stroke: bgColor, fill: strokeColor, r: 4.5 }}
						/>
					);
				})}
			</AreaChart>
		</ResponsiveContainer>
	);
};

PageSpeedAreaChart.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			createdAt: PropTypes.string.isRequired,
			accessibility: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			bestPractices: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			performance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
			seo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
		})
	).isRequired,
	monitor: PropTypes.object.isRequired,
	metrics: PropTypes.object,
};

export default PageSpeedAreaChart;
