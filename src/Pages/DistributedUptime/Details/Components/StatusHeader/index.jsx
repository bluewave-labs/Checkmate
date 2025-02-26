// Components
import { ColContainer } from "../../../../../Components/StandardContainer";
import { Stack, Typography } from "@mui/material";
import PulseDot from "../../../../../Components/Animated/PulseDot";
import LastUpdate from "../LastUpdate";
import ChatBot from "../Chatbot";
import ShareComponent from "../../../../../Components/ShareComponent";

// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const StatusHeader = ({ monitor, connectionStatus, elementToCapture }) => {
	const theme = useTheme();
	const COLOR_MAP = {
		up: theme.palette.successSecondary.main,
		down: theme.palette.error.lowContrast,
	};

	const MSG_MAP = {
		up: "All Systems Operational",
		down: "Last Check Failed",
	};

	const PULSE_COLOR = {
		up: theme.palette.success.main,
		down: theme.palette.error.main,
	};

	let bgColor = COLOR_MAP[connectionStatus];

	return (
		<ColContainer backgroundColor={bgColor}>
			<Stack
				direction={{ s: "column", md: "row" }}
				justifyContent="space-between"
				gap={theme.spacing(8)}
			>
				<Stack
					direction="row"
					gap={theme.spacing(8)}
				>
					<PulseDot color={PULSE_COLOR[connectionStatus]} />
					<Stack>
						<Stack
							direction="row"
							gap={theme.spacing(8)}
						>
							<Typography
								variant="h1"
								color={theme.palette.success.lowContrast}
							>
								{MSG_MAP[connectionStatus]}
							</Typography>
							<Typography
								variant="body2"
								borderRadius={theme.spacing(8)}
								padding={theme.spacing(4)}
								backgroundColor={theme.palette.successSecondary.lowContrast}
								color={theme.palette.success.lowContrast}
							>
								Uptime: {(monitor.totalUptime * 100).toFixed(2)}%
							</Typography>
						</Stack>
						<Typography
							variant="body2"
							color={theme.palette.success.lowContrast}
						>
							Last updated{" "}
							<LastUpdate
								suffix={"seconds ago"}
								lastUpdateTime={monitor.timeSinceLastCheck}
							/>
						</Typography>
					</Stack>
				</Stack>
				<ShareComponent
					elementToCapture={elementToCapture}
					fileName={monitor.name}
				/>
			</Stack>
			<ChatBot sx={{ marginTop: theme.spacing(10) }} />
		</ColContainer>
	);
};

StatusHeader.propTypes = {
	monitor: PropTypes.object,
	connectionStatus: PropTypes.string,
};

export default StatusHeader;
