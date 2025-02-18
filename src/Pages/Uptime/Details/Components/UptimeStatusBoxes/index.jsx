import StatusBoxes from "../../../../../Components/StatusBoxes";
import StatBox from "../../../../../Components/StatBox";
import { getHumanReadableDuration } from "../../../../../Utils/timeUtils";
import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import useUtils from "../../../Monitors/Hooks/useUtils";

const UptimeStatusBoxes = ({ shouldRender, monitor, certificateExpiry }) => {
	const theme = useTheme();
	const { determineState } = useUtils();

	const { time: streakTime, units: streakUnits } = getHumanReadableDuration(
		monitor?.uptimeStreak
	);

	const { time: lastCheckTime, units: lastCheckUnits } = getHumanReadableDuration(
		monitor?.timeSinceLastCheck
	);
	return (
		<StatusBoxes shouldRender={shouldRender}>
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
		</StatusBoxes>
	);
};

export default UptimeStatusBoxes;
