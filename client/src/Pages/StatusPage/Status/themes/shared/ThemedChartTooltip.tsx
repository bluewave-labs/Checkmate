import type { CheckSnapshot, DailyCheckBucket } from "@/Types/Check";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatDateWithTz, formatMs } from "@/Utils/TimeUtils";
import { formatPercentage } from "@/Utils/FormatUtils";
import { useStatusPageTheme } from "@/Pages/StatusPage/Status/themes/StatusPageThemeProvider";
import { useTranslation } from "react-i18next";

export const ThemedChartTooltip = ({ check }: { check: CheckSnapshot }) => {
	const { t } = useTranslation();
	const { timezone } = useStatusPageTheme();
	return (
		<Stack gap={0.25}>
			<Typography
				variant="caption"
				fontWeight={600}
			>
				{check.status
					? formatMs(check.responseTime)
					: t("pages.statusPages.monitorsList.chart.downTooltip")}
			</Typography>
			<Typography
				variant="caption"
				sx={{ opacity: 0.8 }}
			>
				{formatDateWithTz(check.createdAt, "ddd, MMMM D, YYYY, HH:mm A", timezone)}
			</Typography>
		</Stack>
	);
};

export const ThemedDailyTooltip = ({ bucket }: { bucket: DailyCheckBucket }) => {
	const { t } = useTranslation();
	return (
		<Stack gap={0.25}>
			<Typography
				variant="caption"
				fontWeight={600}
			>
				{bucket.date}
			</Typography>
			<Typography
				variant="caption"
				sx={{ opacity: 0.8 }}
			>
				{t("pages.statusPages.monitorsList.chart.dayUptime", {
					uptime: formatPercentage(bucket.upChecks / bucket.totalChecks),
					upChecks: bucket.upChecks.toLocaleString(),
					totalChecks: bucket.totalChecks.toLocaleString(),
				})}
			</Typography>
			{bucket.avgResponseTime !== null && (
				<Typography
					variant="caption"
					sx={{ opacity: 0.8 }}
				>
					{t("pages.statusPages.monitorsList.chart.dayAvgResponse", {
						value: formatMs(bucket.avgResponseTime),
					})}
				</Typography>
			)}
		</Stack>
	);
};
