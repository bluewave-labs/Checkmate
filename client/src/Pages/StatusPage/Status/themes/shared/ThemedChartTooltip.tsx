import type { CheckSnapshot, DailyCheckBucket } from "@/Types/Check";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatDate, formatMs } from "@/Utils/TimeUtils";
import { formatNumber, formatPercentage } from "@/Utils/FormatUtils";
import { useTranslation } from "react-i18next";

export const ThemedChartTooltip = ({
	check,
	timezone,
}: {
	check: CheckSnapshot;
	timezone: string;
}) => {
	const { t, i18n } = useTranslation();
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
				{formatDate(check.createdAt, "dateTime", {
					timeZone: timezone,
					locale: i18n.resolvedLanguage ?? "en",
					timeFormat: "24h",
				})}
			</Typography>
		</Stack>
	);
};

export const ThemedDailyTooltip = ({ bucket }: { bucket: DailyCheckBucket }) => {
	const { t, i18n } = useTranslation();
	const locale = i18n.resolvedLanguage ?? "en";
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
					upChecks: formatNumber(bucket.upChecks, locale),
					totalChecks: formatNumber(bucket.totalChecks, locale),
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
