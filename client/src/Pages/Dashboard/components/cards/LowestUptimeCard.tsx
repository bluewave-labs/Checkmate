import Stack from "@mui/material/Stack";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import { useTranslation } from "react-i18next";
import { formatPercentageFromWhole } from "@/Utils/FormatUtils";
import type { DashboardMonitorRow } from "@/Pages/Dashboard/types";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { LAYOUT } from "@/Utils/Theme/constants";

const TOP_N = 5;

interface LowestUptimeCardProps {
	lowestUptimeMonitors: DashboardMonitorRow[];
	isLoading?: boolean;
	error?: unknown;
	dragHandleProps?: DraggableSyntheticListeners;
}

export const LowestUptimeCard = ({
	lowestUptimeMonitors,
	isLoading,
	error,
	dragHandleProps,
}: LowestUptimeCardProps) => {
	const { t } = useTranslation();

	const top = lowestUptimeMonitors.slice(0, TOP_N);
	const total = lowestUptimeMonitors.length;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.lowestUptime")}
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
				{top.map((monitor) => {
					const uptime = monitor.uptimePercentage;
					const downtime = 100 - uptime;
					return (
						<BarRow
							key={monitor.id}
							label={monitor.name}
							value={formatPercentageFromWhole(uptime)}
							fillRatio={downtime / 100}
						/>
					);
				})}
			</Stack>
		</DashboardCard>
	);
};
