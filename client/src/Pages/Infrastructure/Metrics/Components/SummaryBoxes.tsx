import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/design-elements";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { HardwareMetricsLatest } from "@/Types/Monitor";
import { formatBytes, formatFrequency, PLACEHOLDER } from "@/Utils/FormatUtils";
import { LAYOUT } from "@/Utils/Theme/constants";

const withDetail = (value: string | null, detail: string | null) => {
	if (!value) {
		return PLACEHOLDER;
	}
	if (!detail) {
		return value;
	}
	return `${value} (${detail})`;
};

export const SummaryBoxes = ({ latest }: { latest: HardwareMetricsLatest }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { host, capture, cpu, memory } = latest;
	return (
		<Stack
			direction="row"
			gap={theme.spacing(LAYOUT.MD)}
			flexWrap={"wrap"}
		>
			<StatBox
				title={t("pages.infrastructure.statBoxes.host")}
				subtitle={host.prettyName ?? PLACEHOLDER}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.os")}
				subtitle={withDetail(host.os, host.platform)}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.kernel")}
				subtitle={host.kernelVersion ?? PLACEHOLDER}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.agent")}
				subtitle={withDetail(capture.version, capture.mode)}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.cpuPhysical")}
				subtitle={cpu.physicalCore?.toString() ?? PLACEHOLDER}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.cpuLogical")}
				subtitle={cpu.logicalCore?.toString() ?? PLACEHOLDER}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.maxFrequency")}
				subtitle={formatFrequency(cpu.frequency)}
			/>
			<StatBox
				title={t("pages.infrastructure.statBoxes.memory")}
				subtitle={formatBytes(memory.totalBytes)}
			/>
		</Stack>
	);
};
