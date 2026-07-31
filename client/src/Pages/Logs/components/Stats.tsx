import Box from "@mui/material/Box";
import { StatBox } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Diagnostics } from "@/Types/Diagnostics";
import { formatDuration, formatMs } from "@/Utils/TimeUtils";

interface StatsProps {
	diagnostics: Diagnostics | null;
}

const PLACEHOLDER = "—";

export const Stats = ({ diagnostics }: StatsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const eventLoopDelay = diagnostics
		? formatMs(diagnostics.eventLoopDelayMs ?? 0)
		: PLACEHOLDER;
	const uptime = diagnostics ? formatDuration(diagnostics.uptimeMs ?? 0) : PLACEHOLDER;
	const usedHeap = diagnostics
		? prettyBytes(diagnostics.v8HeapStats?.usedHeapSizeBytes ?? 0)
		: PLACEHOLDER;
	const totalHeap = diagnostics
		? prettyBytes(diagnostics.v8HeapStats?.totalHeapSizeBytes ?? 0)
		: PLACEHOLDER;
	const osMemory = diagnostics
		? prettyBytes(diagnostics.osStats?.totalMemoryBytes ?? 0)
		: PLACEHOLDER;

	return (
		<Box
			display="grid"
			gap={theme.spacing(8)}
			sx={{
				gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" },
				"& > *": { width: "100% !important" },
			}}
		>
			<StatBox
				title={t("pages.logs.diagnostics.stats.eventLoopDelay")}
				subtitle={eventLoopDelay}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.uptime")}
				subtitle={uptime}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.usedHeapSize")}
				subtitle={usedHeap}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.totalHeapSize")}
				subtitle={totalHeap}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.osMemoryLimit")}
				subtitle={osMemory}
			/>
		</Box>
	);
};
