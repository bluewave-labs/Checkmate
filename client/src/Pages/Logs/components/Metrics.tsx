import Stack from "@mui/material/Stack";
import { StatBox } from "@/Components/v2/design-elements";

import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { QueueMetrics } from "@/Types/Queue";

interface MetricsProps {
	metrics: QueueMetrics | null;
}

export const Metrics = ({ metrics }: MetricsProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	if (!metrics) {
		return null;
	}

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			gap={theme.spacing(8)}
		>
			<StatBox
				title={t("pages.logs.metrics.jobs")}
				subtitle={String(metrics.jobs)}
			/>
			<StatBox
				palette={metrics.activeJobs > 0 ? "success" : undefined}
				title={t("pages.logs.metrics.activeJobs")}
				subtitle={String(metrics.activeJobs)}
			/>
			<StatBox
				palette={metrics.failingJobs > 0 ? "error" : undefined}
				title={t("pages.logs.metrics.failingJobs")}
				subtitle={String(metrics.failingJobs)}
			/>
			<StatBox
				title={t("pages.logs.metrics.totalRuns")}
				subtitle={String(metrics.totalRuns)}
			/>
			<StatBox
				palette={metrics.totalFailures > 0 ? "error" : undefined}
				title={t("pages.logs.metrics.totalFailures")}
				subtitle={String(metrics.totalFailures)}
			/>
		</Stack>
	);
};
