import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { SPACING } from "@/Utils/Theme/constants";
import { useTranslation } from "react-i18next";
import type { MonitorsSummary } from "@/Types/Monitor";

interface MonitorStatusCardProps {
	summary: MonitorsSummary;
}

export const MonitorStatusCard = ({ summary }: MonitorStatusCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const up = summary.upMonitors;
	const total = summary.totalMonitors;
	const ratio = total > 0 ? up / total : 0;

	return (
		<DashboardCard title={t("pages.dashboard.cards.monitorStatus")}>
			<Stack gap={theme.spacing(SPACING.SM)}>
				<Stack
					direction="row"
					alignItems="baseline"
					gap={theme.spacing(SPACING.XS)}
				>
					<Typography
						fontSize={typographyLevels.xxl}
						fontWeight={500}
						color={theme.palette.text.primary}
					>
						{up}
					</Typography>
					<Typography
						fontSize={typographyLevels.m}
						color={theme.palette.text.secondary}
					>
						{t("pages.dashboard.monitorStatus.ofUp", { total })}
					</Typography>
				</Stack>
				<Box
					height={4}
					borderRadius={2}
					bgcolor={theme.palette.action.disabledBackground}
					overflow="hidden"
				>
					<Box
						height="100%"
						width={`${ratio * 100}%`}
						borderRadius={2}
						bgcolor={theme.palette.primary.main}
					/>
				</Box>
			</Stack>
		</DashboardCard>
	);
};
