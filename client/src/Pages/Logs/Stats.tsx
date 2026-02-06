import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/v2/design-elements";

import prettyBytes from "pretty-bytes";
import prettyMilliseconds from "pretty-ms";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Diagnostics } from "@/Types/Diagnostics";

interface StatsProps {
	diagnostics: Diagnostics | null;
}

export const Stats = ({ diagnostics }: StatsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!diagnostics) {
		return null;
	}

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			gap={theme.spacing(8)}
		>
			<StatBox
				title={t("pages.logs.diagnostics.stats.eventLoopDelay")}
				subtitle={prettyMilliseconds(diagnostics.eventLoopDelayMs, {
					millisecondsDecimalDigits: 2,
				})}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.uptime")}
				subtitle={prettyMilliseconds(diagnostics.uptimeMs, { hideSeconds: true })}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.uptime")}
				subtitle={prettyMilliseconds(diagnostics.uptimeMs, { hideSeconds: true })}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.usedHeapSize")}
				subtitle={prettyBytes(diagnostics.v8HeapStats.usedHeapSizeBytes)}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.totalHeapSize")}
				subtitle={prettyBytes(diagnostics.v8HeapStats.totalHeapSizeBytes)}
			/>
			<StatBox
				title={t("pages.logs.diagnostics.stats.osMemoryLimit")}
				subtitle={prettyBytes(diagnostics.osStats.totalMemoryBytes)}
			/>
		</Stack>
	);
};
