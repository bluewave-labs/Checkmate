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
import { useState } from "react";

const ChartBoxes = ({
	isLoading = false,
	monitorData,
	dateRange,
	uiTimezone,
	dateFormat,
}) => {
	// Local state
	const [hoveredUptimeData, setHoveredUptimeData] = useState(null);
	const [hoveredIncidentsData, setHoveredIncidentsData] = useState(null);
	const theme = useTheme();
	if (isLoading) {
		return <SkeletonLayout />;
	}

	const noIncidentsMessage = "Great. No Incidents, yet!";

	return (
		<Stack
			direction="row"
			flexWrap="wrap"
			gap={theme.spacing(8)}
		>
			<ChartBox
				icon={<UptimeIcon />}
				header="Uptime"
				isEmpty={false} // TODO
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
								: (monitorData?.groupedUpChecks?.reduce((count, checkGroup) => {
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
								: Math.floor(monitorData?.groupedUptimePercentage * 100 ?? 0)}
							<Typography component="span">
								{hoveredUptimeData !== null ? " ms" : " %"}
							</Typography>
						</Typography>
					</Box>
				</Stack>
				<UpBarChart
					groupedUpChecks={monitorData?.groupedUpChecks}
					type={dateRange}
					onBarHover={setHoveredUptimeData}
				/>
			</ChartBox>
			<ChartBox
				icon={<IncidentsIcon />}
				header="Incidents"
				noDataMessage={noIncidentsMessage}
				isEmpty={monitorData?.groupedDownChecks?.length === 0}
			>
				<Stack width={"100%"}>
					<Box position="relative">
						<Typography component="span">
							{hoveredIncidentsData !== null
								? hoveredIncidentsData.totalChecks
								: (monitorData?.groupedDownChecks?.reduce((count, checkGroup) => {
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
					groupedDownChecks={monitorData?.groupedDownChecks}
					type={dateRange}
					onBarHover={setHoveredIncidentsData}
				/>
			</ChartBox>
			<ChartBox
				icon={<AverageResponseIcon />}
				header="Average Response Time"
			>
				<ResponseGaugeChart avgResponseTime={monitorData?.groupedAvgResponseTime ?? 0} />
			</ChartBox>
		</Stack>
	);
};

export default ChartBoxes;

ChartBoxes.propTypes = {
	isLoading: PropTypes.bool,
	monitorData: PropTypes.object,
	dateRange: PropTypes.string.isRequired,
	uiTimezone: PropTypes.string.isRequired,
	dateFormat: PropTypes.string.isRequired,
	hoveredUptimeData: PropTypes.object,
	setHoveredUptimeData: PropTypes.func,
	hoveredIncidentsData: PropTypes.object,
	setHoveredIncidentsData: PropTypes.func,
};
