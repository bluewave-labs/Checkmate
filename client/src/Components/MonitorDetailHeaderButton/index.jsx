import { Stack } from "@mui/material";
import PropTypes from "prop-types";
import MonitorPauseButton from "../MonitorPauseButton";
import ConfigButton from "../MonitorStatusHeader/ConfigButton";

const MonitorDetailHeaderButton = ({
	isAdmin,
	monitor,
	isLoading = false,
	path,
	showPauseButton = false,
	setMonitorIsActive,
}) => {
	if (!isAdmin) return null;

	return (
		<Stack
			direction="row"
			spacing={2}
		>
			{showPauseButton && (
			<MonitorPauseButton
				monitor={monitor}
				path={path}
				isLoading={isLoading}
				setMonitorIsActive={setMonitorIsActive}
			/>
			)}
			<ConfigButton
				path={path}
				shouldRender={isAdmin}
				monitorId={monitor?._id}
			/>
		</Stack>
	);
};

MonitorDetailHeaderButton.propTypes = {
	isAdmin: PropTypes.bool.isRequired,
	monitor: PropTypes.object.isRequired,
	path: PropTypes.string,
	isLoading: PropTypes.bool,
	showPauseButton: PropTypes.bool,
	setMonitorIsActive: PropTypes.func,
};

export default MonitorDetailHeaderButton;
