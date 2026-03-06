import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { BaseBox } from "@/Components/design-elements";
import { useGet } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";

interface UptimeStatsByPeriodProps {
	monitorId?: string;
}

const periods = ["day", "week", "month", "year", "all"] as const;

const getColor = (value: number, theme: any) => {
	if (value >= 0.99) return theme.palette.success.main;
	if (value >= 0.95) return theme.palette.warning.main;
	return theme.palette.error.main;
};

export const UptimeStatsByPeriod = ({ monitorId }: UptimeStatsByPeriodProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { data } = useGet<Record<string, number>>(
		monitorId ? `/monitors/uptime/stats/${monitorId}` : null,
		{},
		{ revalidateOnFocus: false }
	);

	if (!data) return null;

	return (
		<BaseBox sx={{ padding: `${theme.spacing(4)} ${theme.spacing(8)}` }}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				flexWrap="wrap"
				gap={theme.spacing(4)}
			>
				{periods.map((period) => {
					const value = data[period] ?? 0;
					const percentage = (value * 100).toFixed(2);

					return (
						<Stack
							key={period}
							alignItems="center"
							gap={theme.spacing(1)}
							flex={1}
							minWidth={80}
						>
							<Typography
								variant="body2"
								color="text.secondary"
							>
								{t(`pages.uptime.details.uptimeStats.${period}`)}
							</Typography>
							<Typography
								variant="h2"
								fontWeight={600}
								sx={{ color: getColor(value, theme) }}
							>
								{percentage}%
							</Typography>
						</Stack>
					);
				})}
			</Stack>
		</BaseBox>
	);
};
