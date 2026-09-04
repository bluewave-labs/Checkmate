import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

import { useTheme } from "@mui/material/styles";
import type { MonitorStats, Monitor } from "@/Types/Monitor";
import { getStatusPalette } from "@/Utils/MonitorUtils";
import { useTranslation } from "react-i18next";
import { formatMs, formatDuration } from "@/Utils/TimeUtils";

interface MonitorStatBoxesProps {
	monitor?: Monitor;
	monitorStats: MonitorStats | null;
	certificateExpiry?: string;
	domainExpiry?: string;
}

export const MonitorStatBoxes = ({
	monitor,
	monitorStats,
	certificateExpiry,
	domainExpiry,
}: MonitorStatBoxesProps) => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();
	if (!monitorStats || !monitor) {
		return null;
	}

	const timeOfLastFailure = monitorStats?.timeOfLastFailure || 0;
	const timeSinceLastFailure = timeOfLastFailure > 0 ? Date.now() - timeOfLastFailure : 0;

	const timeOfLastCheck = monitorStats?.lastCheckTimestamp || 0;

	const streakTime = formatDuration(timeSinceLastFailure);
	const lastCheckTime = timeOfLastCheck
		? formatDuration(Date.now() - timeOfLastCheck, {
				long: true,
				relative: true,
				locale: i18n.resolvedLanguage,
			})
		: t("common.labels.na");
	const isActive =
		monitor?.status === "up" ||
		monitor?.status === "paused" ||
		monitor?.status === "maintenance" ||
		monitor?.status === "initializing" ||
		monitor?.status === "breached";
	const palette = getStatusPalette(monitor?.status);

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			gap={theme.spacing(8)}
		>
			<StatBox
				palette={palette}
				title={
					isActive
						? t("pages.common.monitors.statBoxes.activeFor")
						: t("pages.common.monitors.statBoxes.serviceIsDown")
				}
				subtitle={isActive ? streakTime : ""}
			/>
			<StatBox
				title={t("pages.common.monitors.statBoxes.lastCheck")}
				subtitle={lastCheckTime}
			/>
			<StatBox
				title={t("pages.common.monitors.statBoxes.lastResponseTime")}
				subtitle={formatMs(monitorStats?.lastResponseTime ?? 0)}
			/>

			{monitor?.type === "http" && (
				<>
					<StatBox
						title={t("pages.common.monitors.statBoxes.certificateExpiry")}
						subtitle={certificateExpiry || "N/A"}
					/>
					<StatBox
						title={t("pages.common.monitors.statBoxes.domainExpiry")}
						subtitle={domainExpiry || "N/A"}
					/>
				</>
			)}
		</Stack>
	);
};
