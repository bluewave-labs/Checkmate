import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useTranslation } from "react-i18next";
import type { DashboardGroupCount } from "@/Pages/Dashboard/types";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { LAYOUT } from "@/Utils/Theme/constants";

interface MonitorsByGroupCardProps {
	monitorsByGroup: DashboardGroupCount[];
	isLoading?: boolean;
	error?: unknown;
	dragHandleProps?: DraggableSyntheticListeners;
}

export const MonitorsByGroupCard = ({
	monitorsByGroup,
	isLoading,
	error,
	dragHandleProps,
}: MonitorsByGroupCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const maxCount = monitorsByGroup[0]?.count ?? 1;

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.monitorsByGroup")}
			isLoading={isLoading}
			error={error}
			dragHandleProps={dragHandleProps}
		>
			{monitorsByGroup.length === 0 ? (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.secondary}
				>
					{t("pages.dashboard.emptyStates.noGroups")}
				</Typography>
			) : (
				<Stack gap={LAYOUT.SM}>
					{monitorsByGroup.map(({ group, count }) => (
						<BarRow
							key={group}
							label={group}
							value={String(count)}
							fillRatio={count / maxCount}
							valueColor={theme.palette.text.primary}
						/>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};
