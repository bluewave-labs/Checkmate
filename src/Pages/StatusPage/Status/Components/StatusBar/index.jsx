// Components
import { Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Utils
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const getMonitorStatus = (monitors, theme) => {
	const monitorsStatus = {
		icon: (
			<ErrorOutlineIcon
				sx={{ color: theme.palette.primary.contrastTextSecondaryDarkBg }}
			/>
		),
	};
	if (monitors.every((monitor) => monitor.status === true)) {
		monitorsStatus.msg = "All systems operational";
		monitorsStatus.color = theme.palette.success.lowContrast;
		monitorsStatus.icon = (
			<CheckCircleIcon
				sx={{ color: theme.palette.primary.contrastTextSecondaryDarkBg }}
			/>
		);
	}

	if (monitors.every((monitor) => monitor.status === false)) {
		monitorsStatus.msg = "All systems down";
		monitorsStatus.color = theme.palette.error.lowContrast;
	}

	if (monitors.some((monitor) => monitor.status === false)) {
		monitorsStatus.msg = "Degraded performance";
		monitorsStatus.color = theme.palette.warning.lowContrast;
	}

	// Paused or unknown
	if (monitors.some((monitor) => typeof monitor.status === "undefined")) {
		monitorsStatus.msg = "Unknown status";
		monitorsStatus.color = theme.palette.warning.lowContrast;
	}
	return monitorsStatus;
};

const StatusBar = ({ monitors }) => {
	const theme = useTheme();

	if (typeof monitors === "undefined") return;

	const monitorsStatus = getMonitorStatus(monitors, theme);
	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			gap={theme.spacing(2)}
			height={theme.spacing(30)}
			width={"100%"}
			backgroundColor={monitorsStatus.color}
			borderRadius={theme.spacing(2)}
		>
			{monitorsStatus.icon}
			{/* CAIO_REVIEW */}
			<Typography variant="h2DarkBg">{monitorsStatus.msg}</Typography>
		</Stack>
	);
};

export default StatusBar;

StatusBar.propTypes = {
	status: PropTypes.object,
};
