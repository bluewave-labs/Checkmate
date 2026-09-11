import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useTranslation } from "react-i18next";
import type { DashboardMonitorRow } from "@/Pages/Dashboard/types";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";

interface CurrentlyDownCardProps {
	downMonitors: DashboardMonitorRow[];
	isLoading?: boolean;
	error?: unknown;
	dragHandleProps?: DraggableSyntheticListeners;
}

export const CurrentlyDownCard = ({
	downMonitors,
	isLoading,
	error,
	dragHandleProps,
}: CurrentlyDownCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.currentlyDown")}
			isLoading={isLoading}
			error={error}
			dragHandleProps={dragHandleProps}
		>
			{downMonitors.length === 0 ? (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.secondary}
				>
					{t("pages.dashboard.emptyStates.allMonitorsUp")}
				</Typography>
			) : (
				<Stack gap={theme.spacing(1)}>
					{downMonitors.map((m) => (
						<Typography
							key={m.id}
							fontSize={typographyLevels.m}
							color={theme.palette.error.main}
						>
							{m.name}
						</Typography>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};
