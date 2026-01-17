import PropTypes from "prop-types";
import { Stack, Typography } from "@mui/material";
import InfraAreaChart from "../AreaChartBoxes/InfraAreaChart.jsx";

import {
	TzTick,
	InfrastructureTooltip,
	NetworkTick,
	PercentTick,
} from "@/Components/v1/Charts/Utils/chartUtils.jsx";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils.jsx";

const ContainerCharts = ({ containerData, dateRange }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { formatBytesPerSecondString } = useHardwareUtils();

	if (!containerData?.length) {
		return <Typography>{t("noContainerStatsAvailable")}</Typography>;
	}

	const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;

	const configs = [
		{
			type: "container-cpu",
			data: containerData,
			dataKeys: ["cpuUsage"],
			heading: t("cpuUsage"),
			strokeColor: theme.palette.success.main,
			gradientStartColor: theme.palette.success.main,
			yLabel: t("usage"),
			xTick: <TzTick dateRange={dateRange} />,
			yTick: <PercentTick />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.success.main}
					yKey={"cpuUsage"}
					yLabel={t("cpuUsage") + ": "}
					dateRange={dateRange}
					formatter={formatPercentage}
				/>
			),
		},
		{
			type: "container-memory",
			data: containerData,
			dataKeys: ["memoryUsage"],
			heading: t("memoryUsage"),
			strokeColor: theme.palette.accent.main,
			gradientStartColor: theme.palette.accent.main,
			yLabel: t("usage"),
			xTick: <TzTick dateRange={dateRange} />,
			yTick: <PercentTick />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.accent.main}
					yKey={"memoryUsage"}
					yLabel={t("memoryUsage") + ": "}
					dateRange={dateRange}
					formatter={formatPercentage}
				/>
			),
		},
		{
			type: "container-disk-io",
			data: containerData,
			dataKeys: ["diskRead", "diskWrite"],
			heading: t("diskIO"),
			// Don't pass strokeColor - let chart use distinct colors from palette
			yLabel: t("rate"),
			xTick: <TzTick dateRange={dateRange} />,
			yTick: <NetworkTick formatter={formatBytesPerSecondString} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={"#3182bd"}
					yKey={"diskRead"}
					yLabel={t("diskRead") + ": "}
					dotColor2={"#6baed6"}
					yKey2={"diskWrite"}
					yLabel2={t("diskWrite") + ": "}
					dateRange={dateRange}
					formatter={formatBytesPerSecondString}
				/>
			),
		},
		{
			type: "container-network-io",
			data: containerData,
			dataKeys: ["netIn", "netOut"],
			heading: t("networkIO"),
			// Don't pass strokeColor - let chart use distinct colors from palette
			yLabel: t("rate"),
			xTick: <TzTick dateRange={dateRange} />,
			yTick: <NetworkTick formatter={formatBytesPerSecondString} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={"#3182bd"}
					yKey={"netIn"}
					yLabel={t("networkIn") + ": "}
					dotColor2={"#6baed6"}
					yKey2={"netOut"}
					yLabel2={t("networkOut") + ": "}
					dateRange={dateRange}
					formatter={formatBytesPerSecondString}
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

ContainerCharts.propTypes = {
	containerData: PropTypes.array.isRequired,
	dateRange: PropTypes.string.isRequired,
};

export default ContainerCharts;
