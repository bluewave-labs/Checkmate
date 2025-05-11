import { Button, Box } from "@mui/material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { useTranslation } from "react-i18next";
import { pauseUptimeMonitor } from "../../Features/UptimeMonitors/uptimeMonitorsSlice";
import { useDispatch } from "react-redux";
import { createToast } from "../../Utils/toastUtils";

const actionMap = {
	uptime: pauseUptimeMonitor,
};

const MonitorPauseButton = ({ monitor, path, isLoading }) => {
	const dispatch = useDispatch();
	const theme = useTheme();
	const { t } = useTranslation();

	if (!monitor) return null;

	const handlePause = async (e) => {
		e?.stopPropagation?.();

		const monitorId = monitor?._id;
		const actionCreator = actionMap[path];

		if (!actionCreator || !monitorId) {
			return createToast({ body: "Pause action not available." });
		}

		try {
			const action = await dispatch(actionCreator({ monitorId }));

			if (actionCreator.fulfilled.match(action)) {
				const updated = action.payload.data;
				const state = updated?.isActive === true ? "paused" : "resumed";
				createToast({ body: `Monitor ${state} successfully.` });
                createToast({ body: `Refreshing the app ...` });
				// Wait for 5 seconds, then reload the page
				setTimeout(() => {
					window.location.reload();
				}, 2000); 
			} else {
				throw new Error(action.error?.message);
			}
		} catch (err) {
			createToast({ body: "Failed to pause monitor." });
		}
	};

	return (
		<Box alignSelf="flex-end">
			<Button
				onClick={handlePause}
				variant="contained"
				color="secondary"
				disabled={isLoading}
				sx={{ px: theme.spacing(5) }}
			>
				{monitor?.isActive ? (
					<>
						<PauseCircleOutlineIcon />
						{t("pause")}
					</>
				) : (
					<>
						<PlayCircleOutlineRoundedIcon />
						{t("resume")}
					</>
				)}
			</Button>
		</Box>
	);
};

MonitorPauseButton.propTypes = {
	monitor: PropTypes.object.isRequired,
	path: PropTypes.string.isRequired,
    isLoading: PropTypes.bool,
};

export default MonitorPauseButton;
