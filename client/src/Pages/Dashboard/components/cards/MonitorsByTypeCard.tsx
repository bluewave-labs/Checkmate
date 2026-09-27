import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import type { MonitorTypeCount } from "@/Types/Monitor";
import { getMonitorTypeLabel } from "@/Types/Monitor";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

interface MonitorsByTypeCardProps {
	monitorsByType: MonitorTypeCount[];
}

export const MonitorsByTypeCard = ({ monitorsByType }: MonitorsByTypeCardProps) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const maxCount = monitorsByType[0]?.count ?? 1;

	return (
		<DashboardCard title={t("pages.dashboard.cards.monitorsByType")}>
			{monitorsByType.length === 0 ? (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.disabled}
				>
					{t("pages.dashboard.noData")}
				</Typography>
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{monitorsByType.map(({ type, count }) => (
						<BarRow
							key={type}
							label={getMonitorTypeLabel(type, t)}
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
