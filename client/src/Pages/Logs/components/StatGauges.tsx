import Stack from "@mui/material/Stack";
import { DetailGauge } from "@/Components/v2/design-elements";

import { getPercentage, formatPercentageFromWhole } from "@/Utils/FormatUtils";
import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import type { Diagnostics } from "@/Types/Diagnostics";

interface StatGaugesProps {
	diagnostics: Diagnostics | null;
}

export const StatGauges = ({ diagnostics }: StatGaugesProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	if (!diagnostics) {
		return null;
	}

	const heapTotalSize = getPercentage(
		diagnostics?.v8HeapStats?.totalHeapSizeBytes,
		diagnostics?.v8HeapStats?.heapSizeLimitBytes
	);

	const heapUsedSize = getPercentage(
		diagnostics?.v8HeapStats?.usedHeapSizeBytes,
		diagnostics?.v8HeapStats?.heapSizeLimitBytes
	);

	const actualHeapUsed = getPercentage(
		diagnostics?.v8HeapStats?.usedHeapSizeBytes,
		diagnostics?.v8HeapStats?.totalHeapSizeBytes
	);

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			gap={theme.spacing(8)}
		>
			<DetailGauge
				title={t("pages.logs.diagnostics.gauges.heapAllocation")}
				progress={heapTotalSize}
				upperValue={formatPercentageFromWhole(heapTotalSize)}
				lowerLabel={t("pages.logs.diagnostics.gauges.total")}
				lowerValue={prettyBytes(diagnostics.v8HeapStats?.heapSizeLimitBytes ?? 0)}
			/>
			<DetailGauge
				title={t("pages.logs.diagnostics.gauges.heapUsage")}
				progress={heapUsedSize}
				upperLabel={t("pages.logs.diagnostics.gauges.availableMemoryPercentage")}
				upperValue={formatPercentageFromWhole(heapUsedSize)}
				lowerLabel={t("pages.logs.diagnostics.gauges.used")}
				lowerValue={prettyBytes(diagnostics.v8HeapStats?.usedHeapSizeBytes ?? 0)}
			/>
			<DetailGauge
				title={t("pages.logs.diagnostics.gauges.heapUtilization")}
				progress={actualHeapUsed}
				upperLabel={t("pages.logs.diagnostics.gauges.allocatedPercentage")}
				upperValue={formatPercentageFromWhole(actualHeapUsed)}
				lowerLabel={t("pages.logs.diagnostics.gauges.total")}
				lowerValue={prettyBytes(diagnostics.v8HeapStats?.usedHeapSizeBytes ?? 0)}
			/>
			<DetailGauge
				title={t("pages.logs.diagnostics.gauges.instantCpuUsage")}
				progress={diagnostics.cpuUsage?.usagePercentage ?? 0}
				upperLabel={t("pages.logs.diagnostics.gauges.usedSPercentage")}
				upperValue={formatPercentageFromWhole(diagnostics.cpuUsage?.usagePercentage ?? 0)}
			/>
		</Stack>
	);
};
