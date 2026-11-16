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
import { setDashboardUptimeOrder } from "@/Features/UI/uiSlice";
import type { DashboardMonitor } from "@/Types/Dashboard";
import type { AppDispatch, RootState } from "@/store";

interface UptimeCardProps {
	monitors: DashboardMonitor[];
}

export const UptimeCard = ({ monitors }: UptimeCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const order = useSelector((state: RootState) => state.ui.dashboardUptimeOrder);

	// The server already sorts by uptime in the selected order and caps the list.
	const ranked = monitors.filter(
		(monitor): monitor is DashboardMonitor & { uptimePercentage: number } =>
			typeof monitor.uptimePercentage === "number"
	);

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.uptime")}
			topRight={
				<IconButton
					size="small"
					aria-label={t("pages.dashboard.uptimeCard.toggleSortOrder")}
					onClick={() =>
						dispatch(setDashboardUptimeOrder(order === "asc" ? "desc" : "asc"))
					}
				>
					<Icon
						icon={order === "asc" ? ArrowUp : ArrowDown}
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
