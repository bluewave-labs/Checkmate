import PropTypes from "prop-types";
// import PageSpeedIcon from "../../../../assets/icons/page-speed.svg?react";
import PageSpeedIcon from "../../../../../assets/icons/page-speed.svg?react";
import { StatusLabel } from "../../../../../Components/Label";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useTheme } from "@emotion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useSelector } from "react-redux";
import { formatDateWithTz, formatDurationSplit } from "../../../../../Utils/timeUtils";
import useUtils from "../../../../Uptime/Monitors/Hooks/useUtils";
import { useState } from "react";
import IconBox from "../../../../../Components/IconBox";
/**
 * CustomToolTip displays a tooltip with formatted date and score information.
 * @param {Object} props
 * @param {Array} props.payload - Data to display in the tooltip
 * @returns {JSX.Element} The rendered tooltip component
 */
const CustomToolTip = ({ payload }) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state) => state.ui.timezone);

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
				{formatDateWithTz(
					payload[0]?.payload.createdAt,
					"ddd, MMMM D, YYYY, h:mm A",
					uiTimezone
				)}
			</Typography>

			<Stack
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
					backgroundColor={payload[0]?.color}
					sx={{ borderRadius: "50%" }}
				/>
				<Typography
					component="span"
					textTransform="capitalize"
					sx={{ opacity: 0.8 }}
				>
					{payload[0]?.name}
				</Typography>{" "}
				<Typography component="span">{payload[0]?.payload.score}</Typography>
			</Stack>
		</Box>
	);
};

CustomToolTip.propTypes = {
	payload: PropTypes.array,
};

/* TODO separate utils in folder*/
/**
 * Processes the raw data to include a score for each entry.
 * @param {Array<Object>} data - The raw data array.
 * @returns {Array<Object>} - The formatted data array with scores.
 */
const processData = (data) => {
	if (data.length === 0) return [];
	let formattedData = [];

	const calculateScore = (entry) => {
		return (
			(entry.accessibility + entry.bestPractices + entry.performance + entry.seo) / 4
		);
	};

	data.forEach((entry) => {
		entry = { ...entry, score: calculateScore(entry) };
		formattedData.push(entry);
	});

	return formattedData;
};

/* TODO separate component*/
/**
 * Renders an area chart displaying page speed scores.
 * @param {Object} props
 * @param {Array<Object>} props.data - The raw data to be displayed in the chart.
 * @param {string} props.status - The status of the page speed which determines the chart's color scheme.
 * @returns {JSX.Element} - The rendered area chart.
 */
const PagespeedAreaChart = ({ data, status }) => {
	const theme = useTheme();
	const [isHovered, setIsHovered] = useState(false);
	const { statusToTheme } = useUtils();

	const themeColor = statusToTheme[status];

	const formattedData = processData(data);

	return (
		<ResponsiveContainer
			width="100%"
			minWidth={25}
			height={85}
		>
			<AreaChart
				width="100%"
				height="100%"
				data={formattedData}
				margin={{ top: 10, bottom: -5 }}
				style={{ cursor: "pointer" }}
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
				<Tooltip
					cursor={{ stroke: theme.palette.primary.lowContrast }}
					content={<CustomToolTip />}
				/>
				<defs>
					<linearGradient
						id={`pagespeed-chart-${status}`}
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="0%"
							stopColor={theme.palette[themeColor].lowContrast}
							stopOpacity={0.8}
						/>
						<stop
							offset="100%"
							stopColor={theme.palette[themeColor].main}
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<Area
					dataKey="score"
					stroke={theme.palette[themeColor].lowContrast}
					strokeWidth={isHovered ? 2.5 : 1.5}
					fill={`url(#pagespeed-chart-${status})`}
					activeDot={{
						stroke: theme.palette[themeColor].main,
						fill: theme.palette[themeColor].lowContrast,
						r: 4.5,
					}}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};

PagespeedAreaChart.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			accessibility: PropTypes.number.isRequired,
			bestPractices: PropTypes.number.isRequired,
			performance: PropTypes.number.isRequired,
			seo: PropTypes.number.isRequired,
		})
	).isRequired,
	status: PropTypes.string.isRequired,
};

/* TODO separate component */
/**
 * Renders a card displaying monitor details and an area chart.
 * @param {Object} props
 * @param {Object} props.monitor - The monitor data to be displayed in the card.
 * @returns {JSX.Element} - The rendered card.
 */
const Card = ({ monitor }) => {
	const { determineState, pagespeedStatusMsg } = useUtils();
	const theme = useTheme();
	const navigate = useNavigate();
	const monitorState = determineState(monitor);

	return (
		<Grid
			item
			lg={6}
			flexGrow={1}
		>
			<Box
				position="relative"
				p={theme.spacing(8)}
				onClick={() => navigate(`/pagespeed/${monitor._id}`)}
				border={1}
				borderColor={theme.palette.primary.lowContrast}
				borderRadius={theme.shape.borderRadius}
				backgroundColor={theme.palette.primary.main}
				sx={{
					display: "grid",
					gridTemplateColumns: "34px 2fr 1fr",
					columnGap: theme.spacing(5),
					gridTemplateRows: "34px 1fr 3fr",
					cursor: "pointer",
					"&:hover": {
						backgroundColor: theme.palette.tertiary.main,
					},
					"& path": {
						transition: "stroke-width 400ms ease",
					},
				}}
			>
				<IconBox>
					<PageSpeedIcon />
				</IconBox>
				<Typography
					component="h2"
					variant="h2"
					fontWeight={500}
					alignSelf="center"
				>
					{monitor.name}
				</Typography>
				<StatusLabel
					status={monitorState}
					text={pagespeedStatusMsg[monitorState] || "Pending..."}
					customStyles={{
						width: "max-content",
						textTransform: "capitalize",
						alignSelf: "flex-start",
						justifySelf: "flex-end",
					}}
				/>
				<Typography
					variant="body2"
					mt={theme.spacing(-2)}
					sx={{ gridColumnStart: 2 }}
				>
					{monitor.url}
				</Typography>
				<Box
					mx={theme.spacing(-8)}
					mt={theme.spacing(4)}
					mb={theme.spacing(-8)}
					sx={{ gridColumnStart: 1, gridColumnEnd: 4 }}
				>
					<PagespeedAreaChart
						data={monitor.checks.slice().reverse()}
						status={monitorState}
					/>
				</Box>
				<Box
					position="absolute"
					bottom={0}
					py={theme.spacing(1)}
					px={theme.spacing(4)}
					borderTop={1}
					borderRight={1}
					borderColor={theme.palette.primary.lowContrast}
					backgroundColor={theme.palette.tertiary.main}
					sx={{
						pointerEvents: "none",
						userSelect: "none",
						borderTopRightRadius: 8,
						borderBottomLeftRadius: 4,
					}}
				>
					<Typography
						fontSize={11}
						color={theme.palette.primary.contrastTextSecondary}
					>
						Checking every{" "}
						{(() => {
							const { time, format } = formatDurationSplit(monitor?.interval);
							return (
								<>
									<Typography
										component="span"
										fontSize={12}
										color={theme.palette.primary.contrastText}
									>
										{time}{" "}
									</Typography>
									{format}
								</>
							);
						})()}
					</Typography>
				</Box>
			</Box>
		</Grid>
	);
};

Card.propTypes = {
	monitor: PropTypes.object.isRequired,
};

export default Card;
