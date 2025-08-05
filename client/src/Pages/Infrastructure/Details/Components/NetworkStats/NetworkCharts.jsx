// NetworkCharts.jsx
import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import InfraAreaChart from "../../../../../Pages/Infrastructure/Details/Components/AreaChartBoxes/InfraAreaChart";

// Utils
import {
	TzTick,
	InfrastructureTooltip,
} from "../../../../../Components/Charts/Utils/chartUtils";
import { useTheme } from "@emotion/react";

const getFormattedNetworkMetric = (value) => {
	if (typeof value !== "number" || isNaN(value)) return "0";
	if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB/s`;
	if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB/s`;
	if (value >= 1024) return `${(value / 1024).toFixed(1)} KB/s`;
	return `${Math.round(value)} B/s`;
};

const NetworkCharts = ({ eth0Data, dateRange }) => {
	const theme = useTheme();

	const configs = [
		{
			type: "network-bytes",
			data: eth0Data,
			dataKeys: ["bytesPerSec"],
			heading: "Bytes per second",
			strokeColor: theme.palette.info.main,
			gradientStartColor: theme.palette.info.main,
			yLabel: "Bytes per second",
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.info.main}
					yKey={"bytesPerSec"}
					yLabel={"Bytes per second"}
					dateRange={dateRange}
					formatter={getFormattedNetworkMetric}
				/>
			),
		},
		{
			type: "network-packets",
			data: eth0Data,
			dataKeys: ["packetsPerSec"],
			heading: "Packets per second",
			strokeColor: theme.palette.success.main,
			gradientStartColor: theme.palette.success.main,
			yLabel: "Packets per second",
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.success.main}
					yKey={"packetsPerSec"}
					yLabel={"Packets per second"}
					dateRange={dateRange}
					formatter={(value) => Math.round(value).toLocaleString()}
				/>
			),
		},
		{
			type: "network-errors",
			data: eth0Data,
			dataKeys: ["errors"],
			heading: "Errors",
			strokeColor: theme.palette.error.main,
			gradientStartColor: theme.palette.error.main,
			yLabel: "Errors",
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.error.main}
					yKey={"errors"}
					yLabel={"Errors"}
					dateRange={dateRange}
					formatter={(value) => Math.round(value).toLocaleString()}
				/>
			),
		},
		{
			type: "network-drops",
			data: eth0Data,
			dataKeys: ["drops"],
			heading: "Drops",
			strokeColor: theme.palette.warning.main,
			gradientStartColor: theme.palette.warning.main,
			yLabel: "Drops",
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.warning.main}
					yKey={"drops"}
					yLabel={"Drops"}
					dateRange={dateRange}
					formatter={(value) => Math.round(value).toLocaleString()}
				/>
			),
		},
	];

	return (
		<Stack
			direction={"row"}
			gap={theme.spacing(8)}
			flexWrap="wrap"
			sx={{
				"& > *": {
					flexBasis: `calc(50% - ${theme.spacing(8)})`,
					maxWidth: `calc(50% - ${theme.spacing(8)})`,
				},
			}}
		>
			{configs.map((config) => (
				<InfraAreaChart
					key={config.type}
					config={config}
				/>
			))}
		</Stack>
	);
};

NetworkCharts.propTypes = {
	eth0Data: PropTypes.array.isRequired,
	dateRange: PropTypes.string.isRequired,
};

export default NetworkCharts;
