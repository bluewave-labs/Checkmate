import Stack from "@mui/material/Stack";
import { DetailGauge } from "@/Components/v2/design-elements";

import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import type { Diagnostics } from "@/Types/Diagnostics";

interface StatGaugesProps {
	diagnostics: Diagnostics | null;
}

const getPercentage = (value: number, total: number) => {
	if (!value || !total) return 0;
	return (value / total) * 100;
};

const formatPercentage = new Intl.NumberFormat("en-US", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

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
				upperValue={formatPercentage.format(heapTotalSize / 100)}
				lowerLabel={t("pages.logs.diagnostics.gauges.total")}
				lowerValue={prettyBytes(diagnostics.v8HeapStats?.heapSizeLimitBytes ?? 0)}
			/>
			<DetailGauge
				title={t("pages.logs.diagnostics.gauges.heapUsage")}
				progress={heapUsedSize}
				upperLabel={t("pages.logs.diagnostics.gauges.availableMemoryPercentage")}
				upperValue={formatPercentage.format(heapUsedSize / 100)}
				lowerLabel={t("pages.logs.diagnostics.gauges.used")}
				lowerValue={prettyBytes(diagnostics.v8HeapStats?.usedHeapSizeBytes ?? 0)}
			/>
			<DetailGauge
				title={t("pages.logs.diagnostics.gauges.heapUtilization")}
				progress={actualHeapUsed}
				upperLabel={t("pages.logs.diagnostics.gauges.allocatedPercentage")}
				upperValue={formatPercentage.format(actualHeapUsed / 100)}
				lowerLabel={t("pages.logs.diagnostics.gauges.total")}
				lowerValue={prettyBytes(diagnostics.v8HeapStats?.usedHeapSizeBytes ?? 0)}
			/>
			<DetailGauge
				title={t("pages.logs.diagnostics.gauges.instantCpuUsage")}
				progress={diagnostics.cpuUsage?.usagePercentage ?? 0}
				upperLabel={t("pages.logs.diagnostics.gauges.usedSPercentage")}
				upperValue={formatPercentage.format(
					(diagnostics.cpuUsage?.usagePercentage ?? 0) / 100
				)}
			/>
		</Stack>
	);
};
