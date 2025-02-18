// Components
import { Stack } from "@mui/material";
import Gauge from "./Gauge";
import SkeletonLayout from "./skeleton";

// Utils
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";
import { useTheme } from "@emotion/react";

const Gauges = ({ shouldRender, monitor }) => {
	const { decimalToPercentage, formatBytes } = useHardwareUtils();
	const theme = useTheme();

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
			heading: "Memory usage",
			metricOne: "Used",
			valueOne: formatBytes(memoryUsedBytes, true),
			metricTwo: "Total",
			valueTwo: formatBytes(memoryTotalBytes, true),
		},
		{
			type: "cpu",
			value: decimalToPercentage(cpuUsagePercent),
			heading: "CPU usage",
			metricOne: "Cores",
			valueOne: cpuPhysicalCores ?? 0,
			metricTwo: "Frequency",
			valueTwo: `${(cpuFrequency / 1000).toFixed(2)} Ghz`,
		},
		...(latestCheck?.disk ?? []).map((disk, idx) => ({
			type: "disk",
			diskIndex: idx,
			value: decimalToPercentage(disk.usage_percent),
			heading: `Disk${idx} usage`,
			metricOne: "Used",
			valueOne: formatBytes(disk.total_bytes - disk.free_bytes, true),
			metricTwo: "Total",
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
