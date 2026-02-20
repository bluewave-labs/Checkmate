import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Monitor } from "@/Types/Monitor";
import { getAvgTemp, getCores, getFrequency, getOsAndPlatform } from "@/Utils/InfraUtils";

export const StatusBoxes = ({ monitor }: { monitor: Monitor }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const latestCheck = monitor?.recentChecks?.[0];
	// Get data from latest check
	const physicalCores = getCores(latestCheck?.cpu?.physical_core);
	const logicalCores = getCores(latestCheck?.cpu?.logical_core);
	const cpuFrequency = getFrequency(latestCheck?.cpu?.frequency);
	const cpuTemps = latestCheck?.cpu?.temperature ?? [];
	const cpuTemperature = getAvgTemp(cpuTemps);
	const memoryTotalBytes = latestCheck?.memory?.total_bytes ?? 0;
	const diskTotalBytes =
		latestCheck?.disk?.reduce((acc, disk) => acc + (disk.total_bytes || 0), 0) || 0;
	const os = getOsAndPlatform(latestCheck?.host);

	const platform = latestCheck?.host?.platform ?? undefined;
	const osPlatform =
		typeof os === "undefined" && typeof platform === "undefined"
			? undefined
			: `${os} ${platform}`;

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
			<StatBox
				title={t("pages.infrastructure.statBoxes.os")}
				subtitle={osPlatform || "N/A"}
			/>
		</Stack>
	);
};
