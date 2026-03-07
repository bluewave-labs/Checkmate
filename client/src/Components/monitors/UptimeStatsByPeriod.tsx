import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { StatBox } from "@/Components/design-elements";
import { useGet } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import { getUptimeColor } from "@/Utils/MonitorUtils";
import type { MonitorDetailsResponse } from "@/Types/Monitor";

interface UptimeStatsByPeriodProps {
	monitorId?: string;
}

export const UptimeStatsByPeriod = ({ monitorId }: UptimeStatsByPeriodProps) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const swrOpts = { revalidateOnFocus: false, refreshInterval: 60000 };

	const { data: recentData } = useGet<MonitorDetailsResponse>(
		monitorId ? `/monitors/uptime/details/${monitorId}?dateRange=recent` : null,
		{},
		swrOpts
	);
	const { data: dayData } = useGet<MonitorDetailsResponse>(
		monitorId ? `/monitors/uptime/details/${monitorId}?dateRange=day` : null,
		{},
		swrOpts
	);
	const { data: weekData } = useGet<MonitorDetailsResponse>(
		monitorId ? `/monitors/uptime/details/${monitorId}?dateRange=week` : null,
		{},
		swrOpts
	);
	const { data: monthData } = useGet<MonitorDetailsResponse>(
		monitorId ? `/monitors/uptime/details/${monitorId}?dateRange=month` : null,
		{},
		swrOpts
	);

	const results = [
		{ key: "recent", data: recentData },
		{ key: "day", data: dayData },
		{ key: "week", data: weekData },
		{ key: "month", data: monthData },
	];

	// Don't render until we have at least one result
	if (results.every((r) => !r.data)) return null;

	return (
		<Stack
			direction={{ xs: "column", md: "row" }}
			gap={theme.spacing(8)}
		>
			{results.map(({ key, data }) => {
				const value = data?.monitorData?.groupedUptimePercentage ?? 0;
				const percentage = (value * 100).toFixed(2);

				return (
					<StatBox
						key={key}
						title={t(`pages.uptime.details.uptimeStats.${key}`)}
						subtitle=""
						sx={{ flex: 1 }}
					>
						<Typography
							fontWeight={600}
							sx={{ color: getUptimeColor(value, theme) }}
						>
							{percentage}%
						</Typography>
					</StatBox>
				);
			})}
		</Stack>
	);
};
