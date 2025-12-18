// Components
import { Stack } from "@mui/material";
import Gauge from "./Gauge.jsx";
import SkeletonLayout from "./skeleton.jsx";
import PropTypes from "prop-types";

// Utils
import { useHardwareUtils } from "../../Hooks/useHardwareUtils.jsx";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const Gauges = ({ isLoading = false, monitor }) => {
	const { decimalToPercentage, formatBytes, formatDeviceName, formatMountpoint } = useHardwareUtils();
	const theme = useTheme();
	const { t } = useTranslation();

	if (isLoading) {
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
		...(latestCheck?.disk ?? [])
			.filter((disk) => {
				if (!monitor?.selectedDisks || monitor.selectedDisks.length === 0) {
					return true;
				}
				return monitor.selectedDisks.includes(disk.mountpoint || disk.device);
			})
			.map((disk, idx) => ({
				type: "disk",
				diskIndex: idx,
				value: decimalToPercentage(disk.usage_percent),
				heading: `Disk${idx} usage`,
				metricOne: t("used"),
				valueOne: formatBytes(disk.total_bytes - disk.free_bytes, true),
				metricTwo: t("total"),
				valueTwo: formatBytes(disk.total_bytes, true),
				metricThree: t("device"),
				valueThree: formatDeviceName(disk.device),
				metricFour: t("mountpoint"),
				valueFour: formatMountpoint(disk.mountpoint),
			})),
	];

	return (
		<Stack
			direction="row"
			flexWrap="wrap"
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
						metricThree={gauge.metricThree}
						valueThree={gauge.valueThree}
						metricFour={gauge.metricFour}
						valueFour={gauge.valueFour}
					/>
				);
			})}
		</Stack>
	);
};

Gauges.propTypes = {
	isLoading: PropTypes.bool,
	monitor: PropTypes.object,
};

export default Gauges;
