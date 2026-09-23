import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Icon } from "@/Components/design-elements";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { BarRow } from "@/Pages/Dashboard/components/cards/BarRow";
import { getUptimePercentageColor } from "@/Utils/MonitorUtils";
import { formatPercentage } from "@/Utils/FormatUtils";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { LAYOUT } from "@/Utils/Theme/constants";
import { setDashboardUptimeSortOrder } from "@/Features/UI/uiSlice";
import type { Monitor } from "@/Types/Monitor";
import type { AppDispatch, RootState } from "@/store";

const TOP_N = 5;

interface UptimeCardProps {
	monitors: Monitor[];
}

export const UptimeCard = ({ monitors }: UptimeCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const sortOrder = useSelector((state: RootState) => state.ui.dashboardUptimeSortOrder);

	const direction = sortOrder === "ascending" ? 1 : -1;
	const ranked = monitors
		.filter((monitor) => monitor.status !== "paused")
		.filter(
			(monitor): monitor is Monitor & { uptimePercentage: number } =>
				typeof monitor.uptimePercentage === "number"
		)
		.sort((a, b) => direction * (a.uptimePercentage - b.uptimePercentage))
		.slice(0, TOP_N);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.uptime")}
			topRight={
				<IconButton
					size="small"
					aria-label={t("pages.dashboard.uptimeCard.toggleSortOrder")}
					onClick={() =>
						dispatch(
							setDashboardUptimeSortOrder(
								sortOrder === "ascending" ? "descending" : "ascending"
							)
						)
					}
				>
					<Icon
						icon={sortOrder === "ascending" ? ArrowUp : ArrowDown}
						size={16}
						color={theme.palette.text.secondary}
					/>
				</IconButton>
			}
		>
			{ranked.length === 0 ? (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.disabled}
				>
					{t("pages.dashboard.noData")}
				</Typography>
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{ranked.map((monitor) => {
						const paletteKey = getUptimePercentageColor(monitor.uptimePercentage);
						const color = theme.palette[paletteKey].main;
						return (
							<BarRow
								key={monitor.id}
								label={monitor.name}
								value={formatPercentage(monitor.uptimePercentage)}
								fillRatio={monitor.uptimePercentage}
								valueColor={color}
							/>
						);
					})}
				</Stack>
			)}
		</DashboardCard>
	);
};
