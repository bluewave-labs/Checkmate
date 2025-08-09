import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material";
import { Text } from "recharts";
import { formatDateWithTz } from "../../../Utils/timeUtils";
import { Box, Stack, Typography } from "@mui/material";
import { tickDateFormatLookup, tooltipDateFormatLookup } from "./chartUtilFunctions";
/**
 * Custom tick component for rendering time with timezone.
 *
 * @param {Object} props - The properties object.
 * @param {number} props.x - The x-coordinate for the tick.
 * @param {number} props.y - The y-coordinate for the tick.
 * @param {Object} props.payload - The payload object containing tick data.
 * @param {number} props.index - The index of the tick.
 * @returns {JSX.Element} The rendered tick component.
 */
export const TzTick = ({ x, y, payload, index, dateRange }) => {
	const theme = useTheme();
	const uiTimezone = useSelector((state) => state.ui.timezone);
	const format = tickDateFormatLookup(dateRange);
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

TzTick.propTypes = {
	x: PropTypes.number,
	y: PropTypes.number,
	payload: PropTypes.object,
	index: PropTypes.number,
	dateRange: PropTypes.string,
};

/**
 * Custom tick component for rendering percentage values.
 *
 * @param {Object} props - The properties object.
 * @param {number} props.x - The x-coordinate for the tick.
 * @param {number} props.y - The y-coordinate for the tick.
 * @param {Object} props.payload - The payload object containing tick data.
 * @param {number} props.index - The index of the tick.
 * @returns {JSX.Element|null} The rendered tick component or null for the first tick.
 */
export const PercentTick = ({ x, y, payload, index }) => {
	const theme = useTheme();
	if (index === 0) return null;
	return (
		<Text
			x={x - 20}
			y={y}
			textAnchor="middle"
			fill={theme.palette.primary.contrastTextTertiary}
			fontSize={11}
			fontWeight={400}
		>
			{`${(payload?.value * 100).toFixed()}%`}
		</Text>
	);
};

PercentTick.propTypes = {
	x: PropTypes.number,
	y: PropTypes.number,
	payload: PropTypes.object,
	index: PropTypes.number,
};

/**
 * Converts a decimal value to a formatted percentage string.
 *
 * @param {number} value - The decimal value to convert (e.g., 0.75)
 * @returns {string} Formatted percentage string (e.g., "75.00%") or original input if not a number
 *
 * @example
 * getFormattedPercentage(0.7543)   // Returns "75.43%"
 * getFormattedPercentage(1)        // Returns "100.00%"
 * getFormattedPercentage("test")   // Returns "test"
 */
const getFormattedPercentage = (value) => {
	if (typeof value !== "number") return value;
	return `${(value * 100).toFixed(2)}%`;
};

/**
 * Custom tick component for rendering network bytes per second.
 *
 * @param {Object} props - The properties object.
 * @param {number} props.x - The x-coordinate for the tick.
 * @param {number} props.y - The y-coordinate for the tick.
 * @param {Object} props.payload - The payload object containing tick data.
 * @param {number} props.index - The index of the tick.
 * @returns {JSX.Element|null} The rendered tick component or null for the first tick.
 */
export const NetworkTick = ({ x, y, payload, index }) => {
	const theme = useTheme();
	if (index === 0) return null;

	const formatBytes = (bytes) => {
		if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB/s`;
		if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB/s`;
		if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB/s`;
		return `${bytes} B/s`;
	};

	return (
		<Text
			x={x - 20}
			y={y}
			textAnchor="middle"
			fill={theme.palette.primary.contrastTextTertiary}
			fontSize={11}
			fontWeight={400}
		>
			{formatBytes(payload?.value)}
		</Text>
	);
};

NetworkTick.propTypes = {
	x: PropTypes.number,
	y: PropTypes.number,
	payload: PropTypes.object,
	index: PropTypes.number,
};


/**
 * Custom tooltip component for displaying infrastructure data.
 *
 * @param {Object} props - The properties object.
 * @param {boolean} props.active - Indicates if the tooltip is active.
 * @param {Array} props.payload - The payload array containing tooltip data.
 * @param {string} props.label - The label for the tooltip.
 * @param {string} props.yKey - The key for the y-axis data.
 * @param {string} props.yLabel - The label for the y-axis data.
 * @param {string} props.dotColor - The color of the dot in the tooltip.
 * @returns {JSX.Element|null} The rendered tooltip component or null if inactive.
 */
export const InfrastructureTooltip = ({
	active,
	payload,
	label,
	yKey,
	yIdx = -1,
	yLabel,
	dotColor,
	dateRange,
	formatter = getFormattedPercentage,
}) => {
	const uiTimezone = useSelector((state) => state.ui.timezone);
	const theme = useTheme();

	const format = tooltipDateFormatLookup(dateRange);
	if (active && payload && payload.length) {
		const [hardwareType, metric] = yKey.split(".");
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
						backgroundColor={dotColor}
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
							{yIdx >= 0
								? `${yLabel} ${formatter(payload[0].payload[hardwareType][yIdx][metric])}`
								: `${yLabel} ${formatter(payload[0].payload[yKey])}`}
						</Typography>
					</Stack>
				</Box>
				{/* Display original value */}
			</Box>
		);
	}
	return null;
};

InfrastructureTooltip.propTypes = {
	active: PropTypes.bool,
	payload: PropTypes.array,
	label: PropTypes.oneOfType([
		PropTypes.instanceOf(Date),
		PropTypes.string,
		PropTypes.number,
	]),
	yKey: PropTypes.string,
	yIdx: PropTypes.number,
	yLabel: PropTypes.string,
	dotColor: PropTypes.string,
	dateRange: PropTypes.string,
};

export const TemperatureTooltip = ({
	active,
	payload,
	label,
	keys,
	dotColor,
	dateRange,
}) => {
	const uiTimezone = useSelector((state) => state.ui.timezone);
	const theme = useTheme();
	const format = tooltipDateFormatLookup(dateRange);
	const formatCoreKey = (key) => {
		return key.replace(/^core(\d+)$/, "Core $1");
	};
	if (active && payload && payload.length) {
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

				<Stack direction="column">
					{keys.map((key) => {
						return (
							<Stack
								key={key}
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
								<Stack
									direction="row"
									alignItems="center"
									gap={theme.spacing(2)}
								>
									<Box
										display="inline-block"
										width={theme.spacing(4)}
										height={theme.spacing(4)}
										backgroundColor={dotColor}
										sx={{ borderRadius: "50%" }}
									/>

									<Typography
										component="span"
										sx={{ opacity: 0.8 }}
									>
										{`${formatCoreKey(key)}: ${payload[0].payload[key]} °C`}
									</Typography>
								</Stack>
								<Typography component="span"></Typography>
							</Stack>
						);
					})}
				</Stack>
			</Box>
		);
	}
	return null;
};

TemperatureTooltip.propTypes = {
	active: PropTypes.bool,
	keys: PropTypes.array,
	payload: PropTypes.array,
	label: PropTypes.oneOfType([
		PropTypes.instanceOf(Date),
		PropTypes.string,
		PropTypes.number,
	]),
	dotColor: PropTypes.string,
	dateRange: PropTypes.string,
};
