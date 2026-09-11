import Stack from "@mui/material/Stack";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import { useTranslation } from "react-i18next";
import { formatMs } from "@/Utils/TimeUtils";
import type { DashboardMonitorRow } from "@/Pages/Dashboard/types";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { LAYOUT } from "@/Utils/Theme/constants";

const TOP_N = 5;

interface SlowestMonitorsCardProps {
	slowestMonitors: DashboardMonitorRow[];
	isLoading?: boolean;
	error?: unknown;
	dragHandleProps?: DraggableSyntheticListeners;
}

export const SlowestMonitorsCard = ({
	slowestMonitors,
	isLoading,
	error,
	dragHandleProps,
}: SlowestMonitorsCardProps) => {
	const { t } = useTranslation();

	const top = slowestMonitors.slice(0, TOP_N);
	const maxAvg = top[0]?.avgResponseTime ?? 1;
	const total = slowestMonitors.length;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.slowestMonitors")}
			dragHandleProps={dragHandleProps}
			topRight={
				total > 0
					? t("pages.dashboard.emptyStates.topOf", {
							count: Math.min(TOP_N, total),
							total,
						})
					: undefined
			}
			isLoading={isLoading}
			error={error}
		>
			<Stack gap={LAYOUT.SM}>
				{top.map((m) => (
					<BarRow
						key={m.id}
						label={m.name}
						value={formatMs(m.avgResponseTime)}
						fillRatio={m.avgResponseTime / maxAvg}
					/>
				))}
			</Stack>
		</DashboardCard>
	);
};
