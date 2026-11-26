import Stack from "@mui/material/Stack";
import { DetailGauge } from "@/Components/design-elements";

import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTranslation } from "react-i18next";
import type { HardwareMetricsLatest } from "@/Types/Monitor";
import { formatBytes, formatFrequency } from "@/Utils/FormatUtils";
import { LAYOUT } from "@/Utils/Theme/constants";

const GAUGE_MAX_WIDTH = 260;
const PERCENT = 100;

export const OverviewGauges = ({ latest }: { latest: HardwareMetricsLatest }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { cpu, memory } = latest;
	const flexBasis = isSmall ? "auto" : GAUGE_MAX_WIDTH;

	if (cpu.usage === null && memory.usage === null) return null;

	return (
		<Stack
			direction={isSmall ? "column" : "row"}
			spacing={theme.spacing(LAYOUT.MD)}
			alignItems={"stretch"}
			flexWrap={"wrap"}
			useFlexGap
		>
			{cpu.usage !== null && (
				<DetailGauge
					title={t("pages.infrastructure.gauges.cpu.title")}
					maxWidth={GAUGE_MAX_WIDTH}
					progress={cpu.usage * PERCENT}
					upperLabel={t("pages.infrastructure.gauges.cpu.upperLabel")}
					upperValue={formatFrequency(cpu.currentFrequency)}
					lowerLabel={t("pages.infrastructure.gauges.cpu.lowerLabel")}
					lowerValue={formatFrequency(cpu.frequency)}
					flexBasis={flexBasis}
				/>
			)}
			{memory.usage !== null && (
				<DetailGauge
					title={t("pages.infrastructure.gauges.memory.title")}
					maxWidth={GAUGE_MAX_WIDTH}
					progress={memory.usage * PERCENT}
					upperLabel={t("pages.infrastructure.gauges.memory.upperLabel")}
					upperValue={formatBytes(memory.usedBytes)}
					lowerLabel={t("pages.infrastructure.charts.labels.available")}
					lowerValue={formatBytes(memory.availableBytes)}
					flexBasis={flexBasis}
				/>
			)}
		</Stack>
	);
};
