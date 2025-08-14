import PropTypes from "prop-types";
import { Stack, Typography } from "@mui/material";
import InfraAreaChart from "../../../../../Pages/Infrastructure/Details/Components/AreaChartBoxes/InfraAreaChart";

import {
	TzTick,
	InfrastructureTooltip,
	NetworkTick,
} from "../../../../../Components/Charts/Utils/chartUtils";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";

const NetworkCharts = ({ ethernetData, dateRange }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { formatBytesPerSecondString, formatPacketsPerSecondString } = useHardwareUtils();

	if (!ethernetData?.length) {
		return <Typography>{t("noNetworkStatsAvailable")}</Typography>;
	}

	const configs = [
		{
			type: "network-bytes",
			data: ethernetData,
			dataKeys: ["bytesPerSec"],
			heading: t("dataReceived"),
			strokeColor: theme.palette.info.main,
			gradientStartColor: theme.palette.info.main,
			yLabel: t("rate"),
			xTick: <TzTick dateRange={dateRange} />,
			yTick: <NetworkTick formatter={formatBytesPerSecondString} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.info.main}
					yKey={"bytesPerSec"}
					yLabel={t("dataRate") + ": "}
					dateRange={dateRange}
					formatter={formatBytesPerSecondString}
				/>
			),
		},
		{
			type: "network-packets",
			data: ethernetData,
			dataKeys: ["packetsPerSec"],
			heading: t("packetsReceivedRate"),
			strokeColor: theme.palette.success.main,
			gradientStartColor: theme.palette.success.main,
			yLabel: t("rate"),
			xTick: <TzTick dateRange={dateRange} />,
			yTick: <NetworkTick formatter={formatPacketsPerSecondString} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.success.main}
					yKey={"packetsPerSec"}
					yLabel={t("packetsPerSecond") + ": "}
					dateRange={dateRange}
					formatter={formatPacketsPerSecondString}
				/>
			),
		},
		{
			type: "network-errors",
			data: ethernetData,
			dataKeys: ["errors"],
			heading: t("networkErrors"),
			strokeColor: theme.palette.error.main,
			gradientStartColor: theme.palette.error.main,
			yLabel: t("errors"),
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.error.main}
					yKey={"errors"}
					yLabel={t("errors") + ": "}
					dateRange={dateRange}
					formatter={(value) => Math.round(value).toLocaleString()}
				/>
			),
		},
		{
			type: "network-drops",
			data: ethernetData,
			dataKeys: ["drops"],
			heading: t("networkDrops"),
			strokeColor: theme.palette.warning.main,
			gradientStartColor: theme.palette.warning.main,
			yLabel: t("drops"),
			xTick: <TzTick dateRange={dateRange} />,
			toolTip: (
				<InfrastructureTooltip
					dotColor={theme.palette.warning.main}
					yKey={"drops"}
					yLabel={t("drops") + ": "}
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
	ethernetData: PropTypes.array.isRequired,
	dateRange: PropTypes.string.isRequired,
};

export default NetworkCharts;
