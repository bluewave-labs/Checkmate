import Stack from "@mui/material/Stack";
import Status from "./status";
import Skeleton from "./skeleton";
import Button from "@mui/material/Button";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PauseOutlinedIcon from "@mui/icons-material/PauseOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";

// Utils
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { usePauseMonitor } from "../../Hooks/useMonitorControls";
import { useEffect } from "react";
const MonitorDetailsControlHeader = ({
	path,
	isLoading = false,
	isAdmin = false,
	monitor,
	triggerUpdate,
}) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const [pauseMonitor, updatedMonitor, isPausing, error] = usePauseMonitor({
		monitorId: monitor?._id,
		triggerUpdate,
	});

	if (isLoading) {
		return <Skeleton />;
	}

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Status monitor={monitor} />

			<Stack
				direction="row"
				gap={theme.spacing(2)}
			>
				<Button
					variant="contained"
					color="secondary"
					startIcon={
						monitor?.isActive ? <PauseOutlinedIcon /> : <PlayArrowOutlinedIcon />
					}
					onClick={() => {
						pauseMonitor();
					}}
				>
					{monitor?.isActive ? "Pause" : "Resume"}
				</Button>

				{isAdmin && (
					<Button
						variant="contained"
						color="secondary"
						startIcon={<SettingsOutlinedIcon />}
						onClick={() => navigate(`/${path}/configure/${monitor._id}`)}
					>
						Configure
					</Button>
				)}
			</Stack>
		</Stack>
	);
};

MonitorDetailsControlHeader.propTypes = {
	path: PropTypes.string,
	isLoading: PropTypes.bool,
	isAdmin: PropTypes.bool,
	monitor: PropTypes.object,
	triggerUpdate: PropTypes.func,
};

export default MonitorDetailsControlHeader;
