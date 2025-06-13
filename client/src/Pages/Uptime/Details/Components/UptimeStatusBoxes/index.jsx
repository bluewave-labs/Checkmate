import StatusBoxes from "../../../../../Components/StatusBoxes";
import StatBox from "../../../../../Components/StatBox";

import PropTypes from "prop-types";
import { getHumanReadableDuration } from "../../../../../Utils/timeUtils";
import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { useMonitorUtils } from "../../../../../Hooks/useMonitorUtils";

const UptimeStatusBoxes = ({
	isLoading = false,
	monitor,
	monitorStats,
	certificateExpiry,
}) => {
	const theme = useTheme();
	const { determineState } = useMonitorUtils();

	// Determine time since last failure
	const timeOfLastFailure = monitorStats?.timeOfLastFailure;
	const timeSinceLastFailure = timeOfLastFailure > 0 ? Date.now() - timeOfLastFailure : 0;

	// Determine time since last check
	const timeOfLastCheck = monitorStats?.lastCheckTimestamp;
	const timeSinceLastCheck = Date.now() - timeOfLastCheck;

	const { time: streakTime, units: streakUnits } =
		getHumanReadableDuration(timeSinceLastFailure);

	const { time: lastCheckTime, units: lastCheckUnits } =
		getHumanReadableDuration(timeSinceLastCheck);
	return (
		<StatusBoxes shouldRender={!isLoading}>
			<StatBox
				gradient={true}
				status={determineState(monitor)}
				heading={"active for"}
				subHeading={
					<>
						{streakTime}
						<Typography component="span">{streakUnits}</Typography>
					</>
				}
			/>
			<StatBox
				heading="last check"
				subHeading={
					<>
						{lastCheckTime}
						<Typography component="span">{lastCheckUnits}</Typography>
						<Typography component="span">{"ago"}</Typography>
					</>
				}
			/>
			<StatBox
				heading="last response time"
				subHeading={
					<>
						{monitorStats?.lastResponseTime}
						<Typography component="span">{"ms"}</Typography>
					</>
				}
			/>
			{monitor?.type === "http" && (
				<StatBox
					heading="certificate expiry"
					subHeading={
						<Typography
							component="span"
							fontSize={13}
							color={theme.palette.primary.contrastText}
						>
							{certificateExpiry}
						</Typography>
					}
				/>
			)}
		</StatusBoxes>
	);
};

UptimeStatusBoxes.propTypes = {
	shouldRender: PropTypes.bool,
	monitor: PropTypes.object,
	monitorStats: PropTypes.object,
	certificateExpiry: PropTypes.string,
};

export default UptimeStatusBoxes;
