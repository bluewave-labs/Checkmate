// Components
import Stack from "@mui/material/Stack";
import PulseDot from "../../Components/Animated/PulseDot";
import Typography from "@mui/material/Typography";
import Dot from "../../Components/Dot";
// Utils
import { formatDurationRounded } from "../../Utils/timeUtils";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../Hooks/useMonitorUtils";
import { formatMonitorUrl } from "../../Utils/utils";
/**
 * Status component displays the status information of a monitor.
 * It includes the monitor's name, URL, and check interval.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.monitor - The monitor object containing details
 * @param {string} props.monitor.name - The name of the monitor
 * @param {string} props.monitor.url - The URL of the monitor
 * @param {number} props.monitor.interval - The interval at which the monitor checks
 * @returns {JSX.Element} The rendered component
 */
const Status = ({ monitor }) => {
	const theme = useTheme();
	const { statusColor, determineState } = useMonitorUtils();

	return (
		<Stack>
			<Typography variant="monitorName">{monitor?.name}</Typography>
			<Stack
				direction="row"
				alignItems={"center"}
				gap={theme.spacing(4)}
			>
				<PulseDot color={statusColor[determineState(monitor)]} />
				<Typography variant="monitorUrl">{formatMonitorUrl(monitor?.url)}</Typography>
				<Dot />
				<Typography>
					Checking every {formatDurationRounded(monitor?.interval)}.
				</Typography>
			</Stack>
		</Stack>
	);
};

Status.propTypes = {
	monitor: PropTypes.object,
};

export default Status;
