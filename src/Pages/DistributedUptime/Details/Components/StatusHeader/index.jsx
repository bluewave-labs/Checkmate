// Components
import { ColContainer } from "../../../../../Components/StandardContainer";
import { Stack, Typography } from "@mui/material";
import PulseDot from "../../../../../Components/Animated/PulseDot";
import LastUpdate from "../LastUpdate";

// Utils
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";

const StatusHeader = ({ monitor, connectionStatus }) => {
	console.log(monitor);

	const theme = useTheme();

	const COLOR_MAP = {
		up: theme.palette.distributedStatusHeader.up,
		down: theme.palette.distributedStatusHeader.down,
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
							color={theme.palette.distributedStatusHeader.primaryText}
						>
							{MSG_MAP[connectionStatus]}
						</Typography>
						<Typography
							variant="body2"
							borderRadius={theme.spacing(8)}
							padding={theme.spacing(4)}
							backgroundColor={
								theme.palette.distributedStatusHeader.primaryTextBackground
							}
							color={theme.palette.distributedStatusHeader.primaryText}
						>
							Uptime: {(monitor.totalUptime * 100).toFixed(2)}%
						</Typography>
					</Stack>
					<Typography
						variant="body2"
						color={theme.palette.distributedStatusHeader.secondaryText}
					>
						Last updated{" "}
						<LastUpdate
							suffix={"seconds ago"}
							lastUpdateTime={monitor.timeSinceLastCheck}
						/>
					</Typography>
				</Stack>
			</Stack>
		</ColContainer>
	);
};

StatusHeader.propTypes = {
	monitor: PropTypes.object,
	connectionStatus: PropTypes.string,
};

export default StatusHeader;
