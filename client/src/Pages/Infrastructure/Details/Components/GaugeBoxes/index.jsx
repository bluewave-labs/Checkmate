// Components
import { Stack } from "@mui/material";
import Gauge from "./Gauge";
import SkeletonLayout from "./skeleton";

// Utils
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const Gauges = ({ shouldRender, monitor }) => {
	const { decimalToPercentage, formatBytes } = useHardwareUtils();
	const theme = useTheme();
	const { t } = useTranslation();

	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	const { stats } = monitor ?? {};
	let latestCheck = stats?.aggregateData?.latestCheck;
	const memoryUsagePercent = latestCheck?.memory?.usage_percent ?? 0;
	const memoryUsedBytes = latestCheck?.memory?.used_bytes ?? 0;
	const memoryTotalBytes = latestCheck?.memory?.total_bytes ?? 0;
	const cpuUsagePercent = latestCheck?.cpu?.usage_percent ?? 0;
	const cpuPhysicalCores = latestCheck?.cpu?.physical_core ?? 0;
	const cpuFrequency = latestCheck?.cpu?.frequency ?? 0;

	const gauges = [
		{
			type: "memory",
			value: decimalToPercentage(memoryUsagePercent),
			heading: t("memoryUsage"),
			metricOne: t("used"),
			valueOne: formatBytes(memoryUsedBytes, true),
			metricTwo: t("total"),
			valueTwo: formatBytes(memoryTotalBytes, true),
		},
		{
			type: "cpu",
			value: decimalToPercentage(cpuUsagePercent),
			heading: t("cpuUsage"),
			metricOne: t("cores"),
			valueOne: cpuPhysicalCores ?? 0,
			metricTwo: t("frequency"),
			valueTwo: `${(cpuFrequency / 1000).toFixed(2)} Ghz`,
		},
		...(latestCheck?.disk ?? []).map((disk, idx) => ({
			type: "disk",
			diskIndex: idx,
			value: decimalToPercentage(disk.usage_percent),
			heading: `Disk${idx} usage`,
			metricOne: t("used"),
			valueOne: formatBytes(disk.total_bytes - disk.free_bytes, true),
			metricTwo: t("total"),
			valueTwo: formatBytes(disk.total_bytes, true),
		})),
	];

	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
		>
			{gauges.map((gauge) => {
				return (
					<Gauge
						key={`${gauge.type}-${gauge.diskIndex ?? ""}`}
						value={gauge.value}
						heading={gauge.heading}
						metricOne={gauge.metricOne}
						valueOne={gauge.valueOne}
						metricTwo={gauge.metricTwo}
						valueTwo={gauge.valueTwo}
					/>
				);
			})}
		</Stack>
	);
};

export default Gauges;
