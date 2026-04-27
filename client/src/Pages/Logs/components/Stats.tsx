import Box from "@mui/material/Box";
import { StatBox } from "@/Components/design-elements";

import prettyBytes from "pretty-bytes";
import prettyMilliseconds from "pretty-ms";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Diagnostics } from "@/Types/Diagnostics";

interface StatsProps {
	diagnostics: Diagnostics | null;
}

const PLACEHOLDER = "—";

export const Stats = ({ diagnostics }: StatsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const eventLoopDelay = diagnostics
		? prettyMilliseconds(diagnostics.eventLoopDelayMs ?? 0, {
				millisecondsDecimalDigits: 2,
			})
		: PLACEHOLDER;
	const uptime = diagnostics
		? prettyMilliseconds(diagnostics.uptimeMs ?? 0, { hideSeconds: true })
		: PLACEHOLDER;
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
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" },
				gap: theme.spacing(8),
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
