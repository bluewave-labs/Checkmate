import Box from "@mui/material/Box";
import { DetailGauge } from "@/Components/design-elements";

import { getPercentage, formatPercentageFromWhole } from "@/Utils/FormatUtils";
import prettyBytes from "pretty-bytes";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import type { Diagnostics } from "@/Types/Diagnostics";

interface StatGaugesProps {
	diagnostics: Diagnostics | null;
}

const PLACEHOLDER = "—";

export const StatGauges = ({ diagnostics }: StatGaugesProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const heapTotalSize = diagnostics
		? getPercentage(
				diagnostics.v8HeapStats?.totalHeapSizeBytes,
				diagnostics.v8HeapStats?.heapSizeLimitBytes
			)
		: 0;
	const heapUsedSize = diagnostics
		? getPercentage(
				diagnostics.v8HeapStats?.usedHeapSizeBytes,
				diagnostics.v8HeapStats?.heapSizeLimitBytes
			)
		: 0;
	const actualHeapUsed = diagnostics
		? getPercentage(
				diagnostics.v8HeapStats?.usedHeapSizeBytes,
				diagnostics.v8HeapStats?.totalHeapSizeBytes
			)
		: 0;
	const cpuUsage = diagnostics?.cpuUsage?.usagePercentage ?? 0;

	const fmt = (n: number) => (diagnostics ? formatPercentageFromWhole(n) : PLACEHOLDER);
	const bytes = (n: number | undefined) =>
		diagnostics ? prettyBytes(n ?? 0) : PLACEHOLDER;

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
				gap: theme.spacing(8),
				"& > *": { width: "100% !important" },
			}}
		>
			<DetailGauge
				maxWidth={9999}
				title={t("pages.logs.diagnostics.gauges.heapAllocation")}
				progress={heapTotalSize}
				upperValue={fmt(heapTotalSize)}
				lowerLabel={t("pages.logs.diagnostics.gauges.total")}
				lowerValue={bytes(diagnostics?.v8HeapStats?.heapSizeLimitBytes)}
			/>
			<DetailGauge
				maxWidth={9999}
				title={t("pages.logs.diagnostics.gauges.heapUsage")}
				progress={heapUsedSize}
				upperLabel={t("pages.logs.diagnostics.gauges.availableMemoryPercentage")}
				upperValue={fmt(heapUsedSize)}
				lowerLabel={t("pages.logs.diagnostics.gauges.used")}
				lowerValue={bytes(diagnostics?.v8HeapStats?.usedHeapSizeBytes)}
			/>
			<DetailGauge
				maxWidth={9999}
				title={t("pages.logs.diagnostics.gauges.heapUtilization")}
				progress={actualHeapUsed}
				upperLabel={t("pages.logs.diagnostics.gauges.allocatedPercentage")}
				upperValue={fmt(actualHeapUsed)}
				lowerLabel={t("pages.logs.diagnostics.gauges.total")}
				lowerValue={bytes(diagnostics?.v8HeapStats?.usedHeapSizeBytes)}
			/>
			<DetailGauge
				maxWidth={9999}
				title={t("pages.logs.diagnostics.gauges.instantCpuUsage")}
				progress={cpuUsage}
				upperLabel={t("pages.logs.diagnostics.gauges.usedSPercentage")}
				upperValue={fmt(cpuUsage)}
			/>
		</Box>
	);
};
