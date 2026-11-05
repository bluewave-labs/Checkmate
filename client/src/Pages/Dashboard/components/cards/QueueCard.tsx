import { InfoRow } from "@/Pages/Dashboard/components/cards/InfoRow";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import Box from "@mui/material/Box";

import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";

import { useGet } from "@/Hooks/UseApi";
import type { QueueMetrics } from "@/Types/Queue";
import { getSeverityColor } from "@/Utils/MonitorUtils";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

export const QueueCard = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const { data: queueMetrics, isLoading } = useGet<QueueMetrics>(
		`/queue/metrics`,
		{},
		{ refreshInterval: 1000, keepPreviousData: true }
	);

	if (isLoading || !queueMetrics) {
		return (
			<DashboardCard
				title={t("pages.dashboard.cards.queue")}
				isLoading
			/>
		);
	}

	const { jobs, activeJobs, failingJobs, workers, dueBacklog } = queueMetrics;
	const failingRatio = jobs ? failingJobs / jobs : 0;
	const activeRatio = jobs ? activeJobs / jobs : 0;
	return (
		<DashboardCard title={t("pages.dashboard.cards.queue")}>
			<InfoRow
				label={t("pages.dashboard.queue.jobs")}
				value={jobs}
			/>
			<BarRow
				label={t("pages.dashboard.queue.activeJobs")}
				value={`${activeJobs} / ${jobs}`}
				valueColor={getSeverityColor(activeRatio, theme)}
				fillRatio={activeRatio}
			/>
			<BarRow
				label={t("pages.dashboard.queue.failingJobs")}
				value={`${failingJobs} / ${jobs}`}
				valueColor={getSeverityColor(failingRatio, theme)}
				fillRatio={failingRatio}
			/>
			<InfoRow
				label={t("pages.dashboard.queue.workers")}
				value={workers.length}
			/>
			<InfoRow
				label={t("pages.dashboard.queue.overdueChecks")}
				value={
					<Box
						component="span"
						color={
							dueBacklog === 0 ? theme.palette.success.main : theme.palette.warning.main
						}
					>
						{dueBacklog}
					</Box>
				}
			/>
		</DashboardCard>
	);
};
