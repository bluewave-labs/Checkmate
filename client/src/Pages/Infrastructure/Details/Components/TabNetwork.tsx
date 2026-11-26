import Stack from "@mui/material/Stack";
import { NoticeBanner, Tab, Tabs } from "@/Components/design-elements";
import {
	MetricsChartGrid,
	type MetricsChartConfig,
} from "@/Pages/Infrastructure/Details/Components/MetricsChartGrid";
import { hasValues } from "@/Pages/Infrastructure/Details/utils";

import { useState } from "react";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type {
	HardwareMetricsInterface,
	HardwareMetricsInterfaceBucket,
	HardwareMetricsResponse,
} from "@/Types/Monitor";
import type { DateRange } from "@/Types/Query";
import { formatBytesPerSecond, formatCompactNumber } from "@/Utils/FormatUtils";
import { LAYOUT } from "@/Utils/Theme/constants";

const CONTAINER_ONLY_INTERFACE_NAMES = new Set(["lo", "lo0", "docker0"]);
const IDLE_INTERFACE_BYTES_PER_SECOND = 1024;

type InterfaceBucketKey = Exclude<keyof HardwareMetricsInterfaceBucket, "bucketDate">;

const isIdle = (item: HardwareMetricsInterface) =>
	item.buckets.every(
		(bucket) =>
			(bucket.bytesSentPerSecond ?? 0) < IDLE_INTERFACE_BYTES_PER_SECOND &&
			(bucket.bytesRecvPerSecond ?? 0) < IDLE_INTERFACE_BYTES_PER_SECOND
	);

const onlyContainerVisibleInterfaces = (interfaces: HardwareMetricsInterface[]) => {
	if (interfaces.length === 0) return false;
	const containerOnly = interfaces.filter((item) =>
		CONTAINER_ONLY_INTERFACE_NAMES.has(item.name)
	);
	if (containerOnly.length === interfaces.length) return true;
	if (containerOnly.length === 0) return false;
	return interfaces.every(isIdle);
};

const getChartConfigs = (
	buckets: HardwareMetricsInterfaceBucket[],
	t: TFunction
): MetricsChartConfig[] => {
	const sent = t("pages.infrastructure.network.sent");
	const received = t("pages.infrastructure.network.received");
	const charts: { keys: InterfaceBucketKey[]; config: MetricsChartConfig }[] = [
		{
			keys: ["bytesSentPerSecond", "bytesRecvPerSecond"],
			config: {
				key: "throughput",
				title: t("pages.infrastructure.network.throughput"),
				series: [
					{ dataKey: "bytesSentPerSecond", label: sent },
					{ dataKey: "bytesRecvPerSecond", label: received },
				],
				formatter: formatBytesPerSecond,
			},
		},
		{
			keys: ["packetsSentPerSecond", "packetsRecvPerSecond"],
			config: {
				key: "packets",
				title: t("pages.infrastructure.network.packets"),
				series: [
					{ dataKey: "packetsSentPerSecond", label: sent },
					{ dataKey: "packetsRecvPerSecond", label: received },
				],
				formatter: formatCompactNumber,
			},
		},
		{
			keys: ["errIn", "errOut", "dropIn", "dropOut", "fifoIn", "fifoOut"],
			config: {
				key: "errors",
				title: t("pages.infrastructure.network.errors"),
				series: [
					{ dataKey: "errIn", label: t("pages.infrastructure.network.errIn") },
					{ dataKey: "errOut", label: t("pages.infrastructure.network.errOut") },
					{ dataKey: "dropIn", label: t("pages.infrastructure.network.dropIn") },
					{ dataKey: "dropOut", label: t("pages.infrastructure.network.dropOut") },
					{ dataKey: "fifoIn", label: t("pages.infrastructure.network.fifoIn") },
					{ dataKey: "fifoOut", label: t("pages.infrastructure.network.fifoOut") },
				],
				formatter: formatCompactNumber,
			},
		},
	];
	return charts
		.filter((chart) => hasValues(buckets, chart.keys))
		.map((chart) => chart.config);
};

const InterfaceCharts = ({
	item,
	dateRange,
}: {
	item: HardwareMetricsInterface;
	dateRange: DateRange;
}) => {
	const { t } = useTranslation();

	return (
		<MetricsChartGrid
			configs={getChartConfigs(item.buckets, t)}
			data={item.buckets}
			dateRange={dateRange}
		/>
	);
};

export const TabNetwork = ({
	metrics,
	dateRange,
}: {
	metrics: HardwareMetricsResponse | null;
	dateRange: DateRange;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [selectedName, setSelectedName] = useState<string | null>(null);
	if (!metrics) return null;

	const interfaces = metrics.interfaces;
	const selected = interfaces.find((item) => item.name === selectedName) ?? interfaces[0];

	return (
		<Stack gap={theme.spacing(LAYOUT.LG)}>
			{onlyContainerVisibleInterfaces(interfaces) && (
				<NoticeBanner severity="warning">
					{t("pages.infrastructure.charts.labels.loopbackOnlyNotice")}
				</NoticeBanner>
			)}
			{selected && (
				<Tabs
					value={selected.name}
					variant="scrollable"
					scrollButtons={false}
					onChange={(_e, value) => {
						setSelectedName(value);
					}}
				>
					{interfaces.map((item) => (
						<Tab
							key={item.name}
							value={item.name}
							label={item.name}
						/>
					))}
				</Tabs>
			)}
			{selected && (
				<InterfaceCharts
					item={selected}
					dateRange={dateRange}
				/>
			)}
		</Stack>
	);
};
