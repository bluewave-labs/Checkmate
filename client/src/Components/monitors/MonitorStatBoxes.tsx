import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

import prettyMilliseconds from "pretty-ms";
import { useTheme } from "@mui/material/styles";
import type { MonitorStats, Monitor } from "@/Types/Monitor";
import { getStatusPalette } from "@/Utils/MonitorUtils";
import { useTranslation } from "react-i18next";

interface MonitorStatBoxesProps {
	monitor?: Monitor;
	monitorStats: MonitorStats | null;
	certificateExpiry?: string;
}

export const MonitorStatBoxes = ({
	monitor,
	monitorStats,
	certificateExpiry,
}: MonitorStatBoxesProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	if (!monitorStats || !monitor) {
		return null;
	}

	const timeOfLastFailure = monitorStats?.timeOfLastFailure || 0;
	const timeSinceLastFailure =
		timeOfLastFailure > 0
			? Date.now() - timeOfLastFailure
			: Date.now() - new Date(monitorStats?.createdAt || 0).getTime();

	// Determine time since last check
	const timeOfLastCheck = monitorStats?.lastCheckTimestamp || 0;
	const timeSinceLastCheck = Date.now() - timeOfLastCheck || 0;

	const options = {
		secondsDecimalDigits: 0,
		millisecondsDecimalDigits: 0,
	};

	const streakTime = prettyMilliseconds(timeSinceLastFailure, options);

	const lastCheckTime = prettyMilliseconds(timeSinceLastCheck, options);
	const palette = getStatusPalette(monitor?.status);

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			gap={theme.spacing(8)}
		>
			<StatBox
				palette={palette}
				title={
					monitor?.status === "down"
						? t("pages.common.monitors.statBoxes.serviceIsDown")
						: t("pages.common.monitors.statBoxes.activeFor")
				}
				subtitle={monitor?.status === "down" ? "" : streakTime}
			/>
			<StatBox
				title={t("pages.common.monitors.statBoxes.lastCheck")}
				subtitle={lastCheckTime}
			/>
			<StatBox
				title={t("pages.common.monitors.statBoxes.lastResponseTime")}
				subtitle={prettyMilliseconds(monitorStats?.lastResponseTime ?? 0)}
			/>

			{monitor?.type === "http" && (
				<StatBox
					title={t("pages.common.monitors.statBoxes.certificateExpiry")}
					subtitle={certificateExpiry || "N/A"}
				/>
			)}
		</Stack>
	);
};
