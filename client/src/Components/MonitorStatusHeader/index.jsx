import { Stack, Typography } from "@mui/material";
import PulseDot from "../Animated/PulseDot";
import Dot from "../Dot";
import { useTheme } from "@emotion/react";
import useUtils from "../../Pages/Uptime/Monitors/Hooks/useUtils";
import { formatDurationRounded } from "../../Utils/timeUtils";
import ConfigButton from "./ConfigButton";
import SkeletonLayout from "./skeleton";
import PropTypes from "prop-types";

const MonitorStatusHeader = ({ path, isLoading = false, isAdmin, monitor }) => {
	const theme = useTheme();
	const { statusColor, determineState } = useUtils();
	if (isLoading) {
		return <SkeletonLayout />;
	}

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Stack>
				<Typography
					variant="h1"
					className="monitor-name-text"
				>
					{monitor?.name}
				</Typography>
				<Stack
					direction="row"
					alignItems={"center"}
					gap={theme.spacing(4)}
				>
					<PulseDot color={statusColor[determineState(monitor)]} />
					<Typography
						component="h2"
						variant="h2"
						className="monitor-url-text"
					>
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
	isLoading: PropTypes.bool,
	isAdmin: PropTypes.bool,
	monitor: PropTypes.object,
};

export default MonitorStatusHeader;
