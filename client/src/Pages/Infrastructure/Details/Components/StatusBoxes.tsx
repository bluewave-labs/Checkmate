import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { LatestDrives, LatestRaid, Monitor } from "@/Types/Monitor";
import { getAvgTemp, getCores, getFrequency, getOsAndPlatform } from "@/Utils/InfraUtils";
import { isArrayAtRisk, isDriveFailed } from "@/Utils/StorageUtils";

export const StatusBoxes = ({
	monitor,
	raid,
	drives,
}: {
	monitor: Monitor;
	raid?: LatestRaid | null;
	drives?: LatestDrives | null;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const recentChecks = monitor?.recentChecks ?? [];
	const latestCheck = recentChecks[recentChecks.length - 1];
	// Get data from latest check
	const physicalCores = getCores(latestCheck?.cpu?.physical_core);
	const logicalCores = getCores(latestCheck?.cpu?.logical_core);
	const cpuFrequency = getFrequency(latestCheck?.cpu?.frequency);
	const cpuTemps = latestCheck?.cpu?.temperature ?? [];
	const cpuTemperature = getAvgTemp(cpuTemps);
	const memoryTotalBytes = latestCheck?.memory?.total_bytes ?? 0;
	const diskTotalBytes =
		latestCheck?.disk?.reduce((acc, disk) => acc + (disk.total_bytes || 0), 0) || 0;
	const osPlatform = getOsAndPlatform(latestCheck?.host);

	// Storage boxes only appear once Capture reports drives or arrays
	const driveList = drives?.drives ?? [];
	const failingDrives = driveList.filter(
		(drive) => drive.status === "ok" && isDriveFailed(drive)
	).length;
	const arrays = raid?.arrays ?? [];
	const degradedArrays = arrays.filter(isArrayAtRisk).length;

	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
			flexWrap={"wrap"}
		>
			<StatBox
				title={t("pages.infrastructure.statBoxes.cpuPhysical")}
				subtitle={physicalCores.toString()}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.cpuLogical")}
				subtitle={logicalCores.toString()}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.cpuFrequency")}
				subtitle={cpuFrequency}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.avgCpuTemperature")}
				subtitle={cpuTemperature}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.memory")}
				subtitle={prettyBytes(memoryTotalBytes)}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.disk")}
				subtitle={prettyBytes(diskTotalBytes)}
			/>
			{driveList.length > 0 && (
				<StatBox
					title={t("pages.infrastructure.statBoxes.drives")}
					subtitle={
						failingDrives > 0
							? t("pages.infrastructure.storage.summary.drivesFailing", {
									count: driveList.length,
									failing: failingDrives,
								})
							: t("pages.infrastructure.storage.summary.drivesPassed", {
									count: driveList.length,
								})
					}
					palette={failingDrives > 0 ? "error" : undefined}
				/>
			)}
			{arrays.length > 0 && (
				<StatBox
					title={t("pages.infrastructure.statBoxes.raidArrays")}
					subtitle={
						degradedArrays > 0
							? t("pages.infrastructure.storage.summary.arraysDegraded", {
									count: arrays.length,
									degraded: degradedArrays,
								})
							: t("pages.infrastructure.storage.summary.arraysHealthy", {
									count: arrays.length,
								})
					}
					palette={degradedArrays > 0 ? "error" : undefined}
				/>
			)}
			<StatBox
				title={t("pages.infrastructure.statBoxes.os")}
				subtitle={osPlatform || "N/A"}
			/>
		</Stack>
	);
};
