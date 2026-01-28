import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/v2/design-elements";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import prettyMilliseconds from "pretty-ms";
import type { Monitor } from "@/Types/Monitor";
import {
	getAvgTemp,
	getCores,
	getFrequency,
	getGbs,
	getDiskTotalGbs,
	getOsAndPlatform,
} from "@/Utils/InfraUtils";

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
	const memoryTotalBytes = getGbs(latestCheck?.memory?.total_bytes);
	const diskTotalBytes = getDiskTotalGbs(latestCheck?.disk);
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
				subtitle={memoryTotalBytes.toString()}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.disk")}
				subtitle={diskTotalBytes.toString()}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.os")}
				subtitle={osPlatform || "N/A"}
			/>
		</Stack>
	);
};
