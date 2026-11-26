import Grid from "@mui/material/Grid";
import {
	HistogramMetrics,
	type MetricsSeries,
} from "@/Components/monitors/charts/HistogramMetrics";

import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { HardwareMetricsBucket } from "@/Types/Monitor";
import type { DateRange } from "@/Types/Query";
import {
	formatBytes,
	formatFrequency,
	formatPercentage,
	formatTemperature,
} from "@/Utils/FormatUtils";
import { LAYOUT } from "@/Utils/Theme/constants";

interface ChartConfig {
	key: string;
	title: string;
	series: MetricsSeries[];
	formatter: (value: number) => string;
	yDomain?: [number, number];
}

const USAGE_DOMAIN: [number, number] = [0, 1];

const getSensorCount = (buckets: HardwareMetricsBucket[]) =>
	buckets.reduce((max, bucket) => Math.max(max, bucket.cpu.temperature.length), 0);

const getChartConfigs = (
	buckets: HardwareMetricsBucket[],
	t: TFunction
): ChartConfig[] => {
	const sensorCount = getSensorCount(buckets);
	const configs: ChartConfig[] = [
		{
			key: "cpuUsage",
			title: t("common.charts.labels.cpuUsage"),
			series: [{ dataKey: "cpu.usage", label: t("common.charts.labels.cpuUsage") }],
			formatter: formatPercentage,
			yDomain: USAGE_DOMAIN,
		},
		{
			key: "memoryUsage",
			title: t("common.charts.labels.memoryUsage"),
			series: [{ dataKey: "memory.usage", label: t("common.charts.labels.memoryUsage") }],
			formatter: formatPercentage,
			yDomain: USAGE_DOMAIN,
		},
		{
			key: "cpuFrequency",
			title: t("pages.infrastructure.statBoxes.cpuFrequency"),
			series: [
				{
					dataKey: "cpu.currentFrequency",
					label: t("pages.infrastructure.statBoxes.cpuFrequency"),
				},
			],
			formatter: formatFrequency,
		},
		{
			key: "memoryBytes",
			title: t("pages.infrastructure.statBoxes.memory"),
			series: [
				{
					dataKey: "memory.usedBytes",
					label: t("pages.infrastructure.gauges.memory.upperLabel"),
				},
				{
					dataKey: "memory.availableBytes",
					label: t("pages.infrastructure.charts.labels.available"),
				},
			],
			formatter: formatBytes,
		},
	];
	if (sensorCount === 0) {
		return configs;
	}
	configs.push({
		key: "cpuTemperature",
		title: t("pages.infrastructure.charts.labels.temp"),
		series: Array.from({ length: sensorCount }, (_, idx) => ({
			dataKey: `cpu.temperature[${idx}]`,
			label: t("pages.infrastructure.charts.labels.sensor", { number: idx + 1 }),
		})),
		formatter: formatTemperature,
	});
	return configs;
};

export const OverviewCharts = ({
	buckets,
	dateRange,
}: {
	buckets: HardwareMetricsBucket[];
	dateRange: DateRange;
}) => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { t } = useTranslation();

	if (buckets.length === 0) {
		return null;
	}

	return (
		<Grid
			container
			spacing={theme.spacing(LAYOUT.MD)}
		>
			{getChartConfigs(buckets, t).map((config) => (
				<Grid
					size={isSmall ? 12 : 6}
					key={config.key}
				>
					<HistogramMetrics
						title={config.title}
						data={buckets}
						series={config.series}
						range={dateRange}
						formatter={config.formatter}
						yDomain={config.yDomain}
					/>
				</Grid>
			))}
		</Grid>
	);
};
