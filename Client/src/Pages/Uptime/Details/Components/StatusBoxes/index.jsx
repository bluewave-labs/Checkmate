// Components
import { Stack, Typography } from "@mui/material";
import StatBox from "../../../../../Components/StatBox";
import SkeletonLayout from "./skeleton";
// Utils
import { useTheme } from "@mui/material/styles";
import useUtils from "../../../Monitors/Hooks/useUtils";
import { getHumanReadableDuration } from "../../../../../Utils/timeUtils";
import PropTypes from "prop-types";
const StatusBoxes = ({ shouldRender, monitor, certificateExpiry }) => {
	// Utils
	const theme = useTheme();
	const { determineState } = useUtils();

	if (!shouldRender) {
		return <SkeletonLayout />;
	}
	const { time: streakTime, units: streakUnits } = getHumanReadableDuration(
		monitor?.uptimeStreak
	);

	const { time: lastCheckTime, units: lastCheckUnits } = getHumanReadableDuration(
		monitor?.timeSinceLastCheck
	);

	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
		>
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
						{monitor?.latestResponseTime}
						<Typography component="span">{"ms"}</Typography>
					</>
				}
			/>
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
		</Stack>
	);
};

StatusBoxes.propTypes = {
	shouldRender: PropTypes.bool,
	monitor: PropTypes.object,
	certificateExpiry: PropTypes.string,
};

export default StatusBoxes;
