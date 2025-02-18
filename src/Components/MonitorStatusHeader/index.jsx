import { Stack, Typography } from "@mui/material";
import PulseDot from "../Animated/PulseDot";
import Dot from "../Dot";
import { useTheme } from "@emotion/react";
import useUtils from "../../Pages/Uptime/Monitors/Hooks/useUtils";
import { formatDurationRounded } from "../../Utils/timeUtils";
import ConfigButton from "./ConfigButton";
import SkeletonLayout from "./skeleton";
import PropTypes from "prop-types";

const MonitorStatusHeader = ({ path, shouldRender = true, isAdmin, monitor }) => {
	const theme = useTheme();
	const { statusColor, statusMsg, determineState } = useUtils();
	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Stack>
				<Typography variant="h1">{monitor?.name}</Typography>
				<Stack
					direction="row"
					alignItems={"center"}
					gap={theme.spacing(2)}
				>
					<PulseDot color={statusColor[determineState(monitor)]} />
					<Typography variant="h2">
						{monitor?.url?.replace(/^https?:\/\//, "") || "..."}
					</Typography>
					<Dot />
					<Typography>
						Checking every {formatDurationRounded(monitor?.interval)}.
					</Typography>
				</Stack>
			</Stack>
			<ConfigButton
				path={path}
				shouldRender={isAdmin}
				monitorId={monitor?._id}
			/>
		</Stack>
	);
};

MonitorStatusHeader.propTypes = {
	path: PropTypes.string.isRequired,
	shouldRender: PropTypes.bool,
	isAdmin: PropTypes.bool,
	monitor: PropTypes.object,
};

export default MonitorStatusHeader;
