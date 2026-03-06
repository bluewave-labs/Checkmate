import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { BaseBox } from "@/Components/design-elements";
import { useGet } from "@/Hooks/UseApi";
import { useTranslation } from "react-i18next";
import { getUptimeColor } from "@/Utils/MonitorUtils";
import type { MonitorDetailsResponse } from "@/Types/Monitor";

interface UptimeStatsByPeriodProps {
	monitorId?: string;
}

const periods = [
	{ key: "recent", dateRange: "recent" },
	{ key: "day", dateRange: "day" },
	{ key: "week", dateRange: "week" },
	{ key: "month", dateRange: "month" },
] as const;

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
		<BaseBox sx={{ padding: `${theme.spacing(4)} ${theme.spacing(8)}` }}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				flexWrap="wrap"
				gap={theme.spacing(4)}
			>
				{results.map(({ key, data }) => {
					const value = data?.monitorData?.groupedUptimePercentage ?? 0;
					const percentage = (value * 100).toFixed(2);

					return (
						<Stack
							key={key}
							alignItems="center"
							gap={theme.spacing(1)}
							flex={1}
							minWidth={80}
						>
							<Typography
								variant="body2"
								color="text.secondary"
							>
								{t(`pages.uptime.details.uptimeStats.${key}`)}
							</Typography>
							<Typography
								variant="h2"
								fontWeight={600}
								sx={{ color: getUptimeColor(value, theme) }}
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
