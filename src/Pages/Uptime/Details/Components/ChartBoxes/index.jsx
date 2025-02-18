// Components
import { Stack, Typography, Box } from "@mui/material";
import ChartBox from "../../../../../Components/Charts/ChartBox";
import UptimeIcon from "../../../../../assets/icons/uptime-icon.svg?react";
import IncidentsIcon from "../../../../../assets/icons/incidents.svg?react";
import AverageResponseIcon from "../../../../../assets/icons/average-response-icon.svg?react";
import UpBarChart from "../Charts/UpBarChart";
import DownBarChart from "../Charts/DownBarChart";
import ResponseGaugeChart from "../Charts/ResponseGaugeChart";
import SkeletonLayout from "./skeleton";
// Utils
import { formatDateWithTz } from "../../../../../Utils/timeUtils";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";

const ChartBoxes = ({
	shouldRender = true,
	monitor,
	dateRange,
	uiTimezone,
	dateFormat,
	hoveredUptimeData,
	setHoveredUptimeData,
	hoveredIncidentsData,
	setHoveredIncidentsData,
}) => {
	const theme = useTheme();

	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	const totalUpChecks = monitor?.upChecks?.totalChecks ?? 0;
	const totalDownChecks = monitor?.downChecks?.totalChecks ?? 0;
	const denominator =
		totalUpChecks + totalDownChecks > 0 ? totalUpChecks + totalDownChecks : 1;
	const groupedUptimePercentage = (totalUpChecks / denominator) * 100;

	return (
		<Stack
			direction="row"
			flexWrap="wrap"
			gap={theme.spacing(8)}
		>
			<ChartBox
				icon={<UptimeIcon />}
				header="Uptime"
			>
				<Stack
					width={"100%"}
					justifyContent="space-between"
					direction="row"
				>
					<Box position="relative">
						<Typography>Total Checks</Typography>
						<Typography component="span">
							{hoveredUptimeData !== null
								? hoveredUptimeData.totalChecks
								: (monitor?.groupedUpChecks?.reduce((count, checkGroup) => {
										return count + checkGroup.totalChecks;
									}, 0) ?? 0)}
						</Typography>
						{hoveredUptimeData !== null && hoveredUptimeData.time !== null && (
							<Typography
								component="h5"
								position="absolute"
								top="100%"
								fontSize={11}
								color={theme.palette.primary.contrastTextTertiary}
							>
								{formatDateWithTz(hoveredUptimeData._id, dateFormat, uiTimezone)}
							</Typography>
						)}
					</Box>
					<Box>
						<Typography>
							{hoveredUptimeData !== null ? "Avg Response Time" : "Uptime Percentage"}
						</Typography>
						<Typography component="span">
							{hoveredUptimeData !== null
								? Math.floor(hoveredUptimeData?.avgResponseTime ?? 0)
								: Math.floor(groupedUptimePercentage)}
							<Typography component="span">
								{hoveredUptimeData !== null ? " ms" : " %"}
							</Typography>
						</Typography>
					</Box>
				</Stack>
				<UpBarChart
					monitor={monitor}
					type={dateRange}
					onBarHover={setHoveredUptimeData}
				/>
			</ChartBox>
			<ChartBox
				icon={<IncidentsIcon />}
				header="Incidents"
			>
				<Stack width={"100%"}>
					<Box position="relative">
						<Typography component="span">
							{hoveredIncidentsData !== null
								? hoveredIncidentsData.totalChecks
								: (monitor?.groupedDownChecks?.reduce((count, checkGroup) => {
										return count + checkGroup.totalChecks;
									}, 0) ?? 0)}
						</Typography>
						{hoveredIncidentsData !== null && hoveredIncidentsData.time !== null && (
							<Typography
								component="h5"
								position="absolute"
								top="100%"
								fontSize={11}
								color={theme.palette.primary.contrastTextTertiary}
							>
								{formatDateWithTz(hoveredIncidentsData._id, dateFormat, uiTimezone)}
							</Typography>
						)}
					</Box>
				</Stack>
				<DownBarChart
					monitor={monitor}
					type={dateRange}
					onBarHover={setHoveredIncidentsData}
				/>
			</ChartBox>
			<ChartBox
				icon={<AverageResponseIcon />}
				header="Average Response Time"
			>
				<ResponseGaugeChart avgResponseTime={monitor?.avgResponseTime ?? 0} />
			</ChartBox>
		</Stack>
	);
};

export default ChartBoxes;

ChartBoxes.propTypes = {
	shouldRender: PropTypes.bool,
	monitor: PropTypes.object,
	dateRange: PropTypes.string.isRequired,
	uiTimezone: PropTypes.string.isRequired,
	dateFormat: PropTypes.string.isRequired,
	hoveredUptimeData: PropTypes.object,
	setHoveredUptimeData: PropTypes.func,
	hoveredIncidentsData: PropTypes.object,
	setHoveredIncidentsData: PropTypes.func,
};
