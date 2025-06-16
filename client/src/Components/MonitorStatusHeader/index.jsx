import { Stack, Typography } from "@mui/material";
import PulseDot from "../Animated/PulseDot";
import Dot from "../Dot";
import Link from "../Link";
import { useTheme } from "@emotion/react";
import { useMonitorUtils } from "../../Hooks/useMonitorUtils";
import { formatDurationRounded } from "../../Utils/timeUtils";
import ConfigButton from "./ConfigButton";
import SkeletonLayout from "./skeleton";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const MonitorStatusHeader = ({ path, isLoading = false, isAdmin, monitor }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { statusColor, determineState } = useMonitorUtils();
	if (isLoading) {
		return <SkeletonLayout />;
	}

	const intervalText = t("monitorStatus.checkingEvery", {
		interval: formatDurationRounded(monitor?.interval),
	});

	const captureVersion = monitor?.stats?.aggregateData?.latestCheck?.capture?.version;

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
		>
			<Stack>
				<Typography variant="monitorName">{monitor?.name}</Typography>
				<Stack
					direction="row"
					alignItems={"center"}
					gap={theme.spacing(4)}
				>
					<PulseDot color={statusColor[determineState(monitor)]} />
					<Typography
						component="h2"
						variant="monitorUrl"
					>
						<Link
							level="secondary"
							url={monitor?.link?.url || monitor?.url}
							label={monitor?.url?.replace(/^https?:\/\//, "") || "..."}
						/>
					</Typography>
					<Dot />
					<Typography>
						{intervalText}
						{captureVersion && (
							<>
								{" "}
								{t("monitorStatus.withCaptureAgent", {
									version: captureVersion,
								})}
							</>
						)}
						.
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
