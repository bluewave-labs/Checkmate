import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import { getUptimePercentageColor } from "@/Utils/MonitorUtils";
import { formatPercentage } from "@/Utils/FormatUtils";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { SPACING } from "@/Utils/Theme/constants";
import type { Monitor } from "@/Types/Monitor";

const TOP_N = 5;

interface LowestUptimeCardProps {
	monitors: Monitor[];
}

export const LowestUptimeCard = ({ monitors }: LowestUptimeCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const ranked = monitors
		.filter((monitor) => monitor.status !== "paused")
		.filter(
			(monitor): monitor is Monitor & { uptimePercentage: number } =>
				typeof monitor.uptimePercentage === "number"
		)
		.sort((a, b) => a.uptimePercentage - b.uptimePercentage)
		.slice(0, TOP_N);

	return (
		<DashboardCard title={t("pages.dashboard.cards.lowestUptime")}>
			{ranked.length === 0 ? (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.disabled}
				>
					{t("pages.dashboard.noData")}
				</Typography>
			) : (
				<Stack gap={theme.spacing(SPACING.SM)}>
					{ranked.map((monitor) => {
						const paletteKey = getUptimePercentageColor(monitor.uptimePercentage);
						const color = theme.palette[paletteKey].main;
						return (
							<BarRow
								key={monitor.id}
								label={monitor.name}
								value={formatPercentage(monitor.uptimePercentage)}
								fillRatio={1 - monitor.uptimePercentage}
								valueColor={color}
							/>
						);
					})}
				</Stack>
			)}
		</DashboardCard>
	);
};
