import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useTranslation } from "react-i18next";
import type { DashboardCardId } from "@/Pages/Dashboard/dashboardCards";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";

interface StubCardProps {
	cardId: DashboardCardId;
	isLoading?: boolean;
	error?: unknown;
	dragHandleProps?: DraggableSyntheticListeners;
}

export const StubCard = ({
	cardId,
	isLoading,
	error,
	dragHandleProps,
}: StubCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<DashboardCard
			title={t(`pages.dashboard.cards.${cardId}`)}
			isLoading={isLoading}
			error={error}
			dragHandleProps={dragHandleProps}
		>
			<Typography
				fontSize={typographyLevels.m}
				color={theme.palette.text.disabled}
				fontStyle="italic"
			>
				{t("pages.dashboard.comingSoon")}
			</Typography>
		</DashboardCard>
	);
};
