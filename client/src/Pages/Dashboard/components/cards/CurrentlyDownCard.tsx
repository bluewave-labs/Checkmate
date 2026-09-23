import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { DashboardCard } from "@/Pages/Dashboard/components/DashboardCard";
import { Dot } from "@/Components/design-elements";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { LAYOUT } from "@/Utils/Theme/constants";
import type { Monitor } from "@/Types/Monitor";

interface CurrentlyDownCardProps {
	monitors: Monitor[];
}

export const CurrentlyDownCard = ({ monitors }: CurrentlyDownCardProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const downMonitors = monitors.filter((monitor) => monitor.status === "down");

	return (
		<DashboardCard
			title={t("pages.dashboard.cards.currentlyDown")}
			topRight={downMonitors.length > 0 ? downMonitors.length : undefined}
		>
			{downMonitors.length === 0 ? (
				<Typography
					fontSize={typographyLevels.m}
					color={theme.palette.text.disabled}
				>
					{t("pages.dashboard.currentlyDown.empty")}
				</Typography>
			) : (
				<Stack gap={theme.spacing(LAYOUT.SM)}>
					{downMonitors.map((monitor) => (
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
