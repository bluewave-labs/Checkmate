import Stack from "@mui/material/Stack";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import type { DashboardTypeCount } from "@/Pages/Dashboard/types";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { LAYOUT } from "@/Utils/Theme/constants";

interface MonitorsByTypeCardProps {
	monitorsByType: DashboardTypeCount[];
	isLoading?: boolean;
	error?: unknown;
	dragHandleProps?: DraggableSyntheticListeners;
}

export const MonitorsByTypeCard = ({
	monitorsByType,
	isLoading,
	error,
	dragHandleProps,
}: MonitorsByTypeCardProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const maxCount = monitorsByType[0]?.count ?? 1;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.monitorsByType")}
			isLoading={isLoading}
			error={error}
			dragHandleProps={dragHandleProps}
		>
			<Stack gap={LAYOUT.SM}>
				{monitorsByType.map(({ type, count }) => (
					<BarRow
						key={type}
						label={type}
						value={String(count)}
						fillRatio={count / maxCount}
						valueColor={theme.palette.text.primary}
					/>
				))}
			</Stack>
		</DashboardCard>
	);
};
