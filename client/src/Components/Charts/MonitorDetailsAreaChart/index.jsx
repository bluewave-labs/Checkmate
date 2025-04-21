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
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { formatDateWithTz } from "../../../Utils/timeUtils";
import {
	tooltipDateFormatLookup,
	tickDateFormatLookup,
} from "../Utils/chartUtilFunctions";

import "./index.css";
const CustomToolTip = ({ active, payload, label, dateRange }) => {
	const format = tooltipDateFormatLookup(dateRange);
	const uiTimezone = useSelector((state) => state.ui.timezone);
	const theme = useTheme();
	if (active && payload && payload.length) {
		const responseTime = payload[0]?.payload?.originalAvgResponseTime
			? payload[0]?.payload?.originalAvgResponseTime
			: (payload[0]?.payload?.avgResponseTime ?? 0);
		return (
			<Box
				className="area-tooltip"
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
					{formatDateWithTz(label, format, uiTimezone)}
				</Typography>
				<Box mt={theme.spacing(1)}>
					<Box
						display="inline-block"
						width={theme.spacing(4)}
						height={theme.spacing(4)}
						backgroundColor={theme.palette.primary.main}
						sx={{ borderRadius: "50%" }}
					/>
					<Stack
						display="inline-flex"
						direction="row"
						justifyContent="space-between"
						ml={theme.spacing(3)}
						sx={{
							"& span": {
								color: theme.palette.primary.contrastTextTertiary,
								fontSize: 11,
								fontWeight: 500,
							},
						}}
					>
						<Typography
							component="span"
							sx={{ opacity: 0.8 }}
						>
							Response time:
						</Typography>
						<Typography
							ml={theme.spacing(4)}
							component="span"
						>
							{Math.floor(responseTime)}
							<Typography
								component="span"
								sx={{ opacity: 0.8 }}
							>
								{" "}
								ms
							</Typography>
						</Typography>
					</Stack>
				</Box>
				{/* Display original value */}
			</Box>
		);
	}
	return null;
};

CustomToolTip.propTypes = {
	active: PropTypes.bool,
	payload: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.number,
			payload: PropTypes.shape({
				_id: PropTypes.string,
				avgResponseTime: PropTypes.number,
				originalAvgResponseTime: PropTypes.number,
			}),
		})
	),
	label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	dateRange: PropTypes.string,
};
const CustomTick = ({ x, y, payload, dateRange }) => {
	const format = tickDateFormatLookup(dateRange);
	const theme = useTheme();
	const uiTimezone = useSelector((state) => state.ui.timezone);
	return (
		<Text
			x={x}
			y={y + 10}
			textAnchor="middle"
			fill={theme.palette.primary.contrastTextTertiary}
			fontSize={11}
			fontWeight={400}
		>
			{formatDateWithTz(payload?.value, format, uiTimezone)}
		</Text>
	);
};

CustomTick.propTypes = {
	x: PropTypes.number,
	y: PropTypes.number,
	payload: PropTypes.object,
	index: PropTypes.number,
	dateRange: PropTypes.string,
};

const MonitorDetailsAreaChart = ({ checks, dateRange }) => {
	const theme = useTheme();
	const memoizedChecks = useMemo(() => checks, [checks[0]]);
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
				data={memoizedChecks}
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
							stopColor={theme.palette.accent.main}
							stopOpacity={0.8}
						/>
						<stop
							offset="100%"
							stopColor={theme.palette.accent.light}
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<XAxis
					stroke={theme.palette.primary.lowContrast}
					dataKey="_id"
					tick={<CustomTick dateRange={dateRange} />}
					axisLine={false}
					tickLine={false}
					height={20}
				/>
				<Tooltip
					cursor={{ stroke: theme.palette.primary.lowContrast }}
					content={<CustomToolTip dateRange={dateRange} />}
					wrapperStyle={{ pointerEvents: "none" }}
				/>
				<Area
					type="monotone"
					dataKey="avgResponseTime"
					stroke={theme.palette.accent.main} // CAIO_REVIEW
					fill="url(#colorUv)"
					strokeWidth={isHovered ? 2.5 : 1.5}
					activeDot={{ stroke: theme.palette.accent.main, r: 5 }} // CAIO_REVIEW
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};

MonitorDetailsAreaChart.propTypes = {
	checks: PropTypes.array,
	dateRange: PropTypes.string,
};

export default MonitorDetailsAreaChart;
