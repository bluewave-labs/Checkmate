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
import {
	MetricsChartGrid,
	type MetricsChartConfig,
} from "@/Pages/Infrastructure/Metrics/Components/MetricsChartGrid";

const USAGE_DOMAIN: [number, number] = [0, 1];

const getSensorCount = (buckets: HardwareMetricsBucket[]) =>
	buckets.reduce((max, bucket) => Math.max(max, bucket.cpu.temperature.length), 0);

const getChartConfigs = (
	buckets: HardwareMetricsBucket[],
	t: TFunction
): MetricsChartConfig[] => {
	const sensorCount = getSensorCount(buckets);
	const configs: MetricsChartConfig[] = [
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
	const { t } = useTranslation();

	if (buckets.length === 0) {
		return null;
	}

	return (
		<MetricsChartGrid
			configs={getChartConfigs(buckets, t)}
			data={buckets}
			dateRange={dateRange}
		/>
	);
};
