// Components
import Stack from "@mui/material/Stack";
import PulseDot from "../../Components/Animated/PulseDot";
import Typography from "@mui/material/Typography";
import Dot from "../../Components/Dot";
// Utils
import { formatDurationRounded } from "../../Utils/timeUtils";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import useUtils from "../../Pages/Uptime/Monitors/Hooks/useUtils";

const Status = ({ monitor }) => {
	const theme = useTheme();
	const { statusColor, determineState } = useUtils();

	return (
		<Stack>
			<Typography variant="h1">{monitor?.name}</Typography>
			<Stack
				direction="row"
				alignItems={"center"}
				gap={theme.spacing(4)}
			>
				<PulseDot color={statusColor[determineState(monitor)]} />
				<Typography
					variant="h2"
					style={{ fontFamily: "monospace", fontWeight: "bolder" }}
				>
					{monitor?.url?.replace(/^https?:\/\//, "") || "..."}
				</Typography>
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
