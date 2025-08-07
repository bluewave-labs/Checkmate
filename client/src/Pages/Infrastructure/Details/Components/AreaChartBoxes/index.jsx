// Components
import { Stack } from "@mui/material";
import InfraAreaChart from "./InfraAreaChart";
import SkeletonLayout from "./skeleton";

// Utils
import {
	PercentTick,
	TzTick,
	InfrastructureTooltip,
	TemperatureTooltip,
} from "../../../../../Components/Charts/Utils/chartUtils";
import { useTheme } from "@emotion/react";
import { useHardwareUtils } from "../../../../../Hooks/useHardwareUtils";
import { useTranslation } from "react-i18next";
const AreaChartBoxes = ({ shouldRender, monitor, dateRange }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { buildTemps } = useHardwareUtils();

	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	const { stats } = monitor ?? {};
	const { checks } = stats;

	let latestCheck = checks[0];
	const { temps, tempKeys } = buildTemps(checks);

	const configs = [
		{
			type: "memory",
			data: checks,
			dataKeys: ["avgMemoryUsage"],
			heading: t("memoryUsage"),
			strokeColor: theme.palette.accent.main, // CAIO_REVIEW
			gradientStartColor: theme.palette.accent.main, // CAIO_REVIEW
			yLabel: t("memoryUsage"),
			yDomain: [0, 1],
			yTick: <PercentTick />,
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.primary.main}
					yKey={"avgMemoryUsage"}
					yLabel={"Memory usage"}
					dateRange={dateRange}
				/>
			),
		},
		{
			type: "cpu",
			data: checks,
			dataKeys: ["avgCpuUsage"],
			heading: t("cpuUsage"),
			strokeColor: theme.palette.success.main,
			gradientStartColor: theme.palette.success.main,
			yLabel: t("cpuUsage"),
			yDomain: [0, 1],
			yTick: <PercentTick />,
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.success.main}
					yKey={"avgCpuUsage"}
					yLabel={"CPU usage"}
					dateRange={dateRange}
				/>
			),
		},
		{
			type: "temperature",
			data: temps,
			dataKeys: tempKeys,
			strokeColor: theme.palette.error.main,
			gradientStartColor: theme.palette.error.main,
			heading: t("cpuTemperature"),
			yLabel: "Temperature",
			xTick: <TzTick dateRange={dateRange} />,
			yDomain: [
				0,
				Math.max(Math.max(...temps.flatMap((t) => tempKeys.map((k) => t[k]))) * 1.1, 200),
			],
			toolTip: (
				<TemperatureTooltip
					keys={tempKeys}
					dotColor={theme.palette.error.main}
					dateRange={dateRange}
				/>
			),
		},
		...(latestCheck?.disks?.map((disk, idx) => ({
			type: "disk",
			data: checks,
			diskIndex: idx,
			dataKeys: [`disks[${idx}].usagePercent`],
			heading: `Disk${idx} usage`,
			strokeColor: theme.palette.warning.main,
			gradientStartColor: theme.palette.warning.main,
			yLabel: t("diskUsage"),
			yDomain: [0, 1],
			yTick: <PercentTick />,
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.warning.main}
					yKey={`disks.usagePercent`}
					yLabel={"Disc usage"}
					yIdx={idx}
					dateRange={dateRange}
				/>
			),
		})) || []),
	];

	return (
		<Stack
			direction={"row"}
			// height={chartContainerHeight} // FE team HELP! Possibly no longer needed?
			gap={theme.spacing(8)} // FE team HELP!
			flexWrap="wrap" // //FE team HELP! Better way to do this?
			sx={{
				"& > *": {
					flexBasis: `calc(50% - ${theme.spacing(8)})`,
					maxWidth: `calc(50% - ${theme.spacing(8)})`,
				},
			}}
		>
			{configs.map((config) => (
				<InfraAreaChart
					key={`${config.type}-${config.diskIndex ?? ""}`}
					config={config}
				/>
			))}
		</Stack>
	);
};

export default AreaChartBoxes;
