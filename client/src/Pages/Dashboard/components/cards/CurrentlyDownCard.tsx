import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { Dot } from "@/Components/design-elements";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { DashboardMonitor } from "@/Types/Dashboard";

interface CurrentlyDownCardProps {
	monitors: DashboardMonitor[];
	total: number;
}

export const CurrentlyDownCard = ({ monitors, total }: CurrentlyDownCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.currentlyDown")}
			topRight={total > 0 ? total : undefined}
		>
			{monitors.length === 0 ? (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.disabled}
				>
					{t("pages.dashboard.currentlyDown.empty")}
				</Typography>
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{monitors.map((monitor) => (
						<Stack
							key={monitor.id}
							direction="row"
							alignItems="center"
							gap={theme.spacing(LAYOUT.XS)}
						>
							<Dot color={theme.palette.error.main} />
							<Typography
								fontSize={typographyLevels.m}
								color={theme.palette.text.primary}
								overflow="hidden"
								textOverflow="ellipsis"
								whiteSpace="nowrap"
							>
								{monitor.name}
							</Typography>
						</Stack>
					))}
				</Stack>
			)}
		</DashboardCard>
	);
};
