import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { useMonitorUtils } from "../../../../Hooks/useMonitorUtils";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PulseDot from "../../../../Components/Animated/PulseDot";
import PropTypes from "prop-types";
const MonitorStatusHeader = ({ monitor, infrastructureMonitor }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { statusColor, pagespeedStatusMsg, determineState } = useMonitorUtils();
	return (
		<Stack
			direction="row"
			alignItems="center"
			height="fit-content"
			gap={theme.spacing(2)}
		>
			<Tooltip
				title={pagespeedStatusMsg[determineState(monitor)]}
				disableInteractive
				slotProps={{
					popper: {
						modifiers: [
							{
								name: "offset",
								options: { offset: [0, -8] },
							},
						],
					},
				}}
			>
				<Box>
					<PulseDot color={statusColor[determineState(monitor)]} />
				</Box>
			</Tooltip>
			<Typography
				component="h2"
				variant="monitorUrl"
			>
				{infrastructureMonitor.url?.replace(/^https?:\/\//, "") || "..."}
			</Typography>
			<Typography
				position="relative"
				variant="body2"
				ml={theme.spacing(6)}
				mt={theme.spacing(1)}
				sx={{
					"&:before": {
						position: "absolute",
						content: `""`,
						width: theme.spacing(2),
						height: theme.spacing(2),
						borderRadius: "50%",
						backgroundColor: theme.palette.primary.contrastTextTertiary,
						opacity: 0.8,
						left: theme.spacing(-5),
						top: "50%",
						transform: "translateY(-50%)",
					},
				}}
			>
				{t("editing")}
			</Typography>
		</Stack>
	);
};

MonitorStatusHeader.propTypes = {
	monitor: PropTypes.object.isRequired,
	infrastructureMonitor: PropTypes.object.isRequired,
};

export default MonitorStatusHeader;
