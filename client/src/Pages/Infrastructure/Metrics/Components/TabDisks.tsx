import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DetailGauge } from "@/Components/design-elements";
import {
	MetricsChartGrid,
	type MetricsChartConfig,
} from "@/Pages/Infrastructure/Metrics/Components/MetricsChartGrid";

import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type {
	HardwareMetricsDisk,
	HardwareMetricsDiskBucket,
	HardwareMetricsResponse,
} from "@/Types/Monitor";
import type { DateRange } from "@/Types/Query";
import {
	formatBytes,
	formatBytesPerSecond,
	formatCompactNumber,
	formatNumber,
} from "@/Utils/FormatUtils";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

const GAUGE_MAX_WIDTH = 260;
const PERCENT = 100;

type DiskBucketKey = Exclude<keyof HardwareMetricsDiskBucket, "bucketDate">;

const hasValues = (buckets: HardwareMetricsDiskBucket[], keys: DiskBucketKey[]) =>
	buckets.some((bucket) => keys.some((key) => bucket[key] !== null));

const getChartConfigs = (
	buckets: HardwareMetricsDiskBucket[],
	t: TFunction
): MetricsChartConfig[] => {
	const used = t("pages.infrastructure.gauges.disk.upperLabel");
	const free = t("pages.infrastructure.gauges.disk.lowerLabel");
	const read = t("pages.infrastructure.disks.read");
	const write = t("pages.infrastructure.disks.write");
	const charts: { keys: DiskBucketKey[]; config: MetricsChartConfig }[] = [
		{
			keys: ["usedBytes", "freeBytes"],
			config: {
				key: "space",
				title: t("pages.infrastructure.disks.space"),
				series: [
					{ dataKey: "usedBytes", label: used },
					{ dataKey: "freeBytes", label: free },
				],
				formatter: formatBytes,
			},
		},
		{
			keys: ["usedInodes", "freeInodes"],
			config: {
				key: "inodes",
				title: t("pages.infrastructure.disks.inodes"),
				series: [
					{ dataKey: "usedInodes", label: used },
					{ dataKey: "freeInodes", label: free },
				],
				formatter: formatCompactNumber,
			},
		},
		{
			keys: ["readBytesPerSecond", "writeBytesPerSecond"],
			config: {
				key: "throughput",
				title: t("pages.infrastructure.disks.throughput"),
				series: [
					{ dataKey: "readBytesPerSecond", label: read },
					{ dataKey: "writeBytesPerSecond", label: write },
				],
				formatter: formatBytesPerSecond,
			},
		},
		{
			keys: ["readTimeFraction", "writeTimeFraction"],
			config: {
				key: "queueDepth",
				title: t("pages.infrastructure.disks.queueDepth"),
				series: [
					{ dataKey: "readTimeFraction", label: read },
					{ dataKey: "writeTimeFraction", label: write },
				],
				formatter: (value) => formatNumber(value),
			},
		},
	];
	return charts
		.filter((chart) => hasValues(buckets, chart.keys))
		.map((chart) => chart.config);
};

const DiskGauges = ({ disk }: { disk: HardwareMetricsDisk }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const flexBasis = isSmall ? "auto" : GAUGE_MAX_WIDTH;
	const latest = disk.latest;

	if (!latest) return null;
	if (latest.usage === null && latest.inodesUsage === null) return null;

	return (
		<Stack
			direction={isSmall ? "column" : "row"}
			spacing={theme.spacing(LAYOUT.MD)}
			alignItems={"stretch"}
			flexWrap={"wrap"}
			useFlexGap
		>
			{latest.usage !== null && (
				<DetailGauge
					title={t("pages.infrastructure.charts.labels.disk")}
					maxWidth={GAUGE_MAX_WIDTH}
					progress={latest.usage * PERCENT}
					upperLabel={t("pages.infrastructure.gauges.disk.upperLabel")}
					upperValue={formatBytes(latest.usedBytes)}
					lowerLabel={t("pages.infrastructure.gauges.disk.lowerLabel")}
					lowerValue={formatBytes(latest.freeBytes)}
					flexBasis={flexBasis}
				/>
			)}
			{latest.inodesUsage !== null && (
				<DetailGauge
					title={t("pages.infrastructure.disks.inodeUsage")}
					maxWidth={GAUGE_MAX_WIDTH}
					progress={latest.inodesUsage * PERCENT}
					upperLabel={t("pages.infrastructure.gauges.disk.upperLabel")}
					upperValue={formatCompactNumber(latest.usedInodes)}
					lowerLabel={t("pages.infrastructure.gauges.disk.lowerLabel")}
					lowerValue={formatCompactNumber(latest.freeInodes)}
					flexBasis={flexBasis}
				/>
			)}
		</Stack>
	);
};

const DiskBlock = ({
	disk,
	dateRange,
}: {
	disk: HardwareMetricsDisk;
	dateRange: DateRange;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return (
		<Stack gap={theme.spacing(LAYOUT.MD)}>
			<Stack
				direction="row"
				alignItems="baseline"
				gap={theme.spacing(LAYOUT.XS)}
			>
				<Typography fontSize={typographyLevels.l}>{disk.device}</Typography>
				<Typography color={theme.palette.text.secondary}>{disk.mountpoint}</Typography>
			</Stack>
			<DiskGauges disk={disk} />
			<MetricsChartGrid
				configs={getChartConfigs(disk.buckets, t)}
				data={disk.buckets}
				dateRange={dateRange}
			/>
		</Stack>
	);
};

export const TabDisks = ({
	metrics,
	dateRange,
}: {
	metrics: HardwareMetricsResponse | null;
	dateRange: DateRange;
}) => {
	const theme = useTheme();
	if (!metrics) return null;

	return (
		<Stack gap={theme.spacing(LAYOUT.XL)}>
			{metrics.disks.map((disk) => (
				<DiskBlock
					key={`${disk.device}-${disk.mountpoint}`}
					disk={disk}
					dateRange={dateRange}
				/>
			))}
		</Stack>
	);
};
