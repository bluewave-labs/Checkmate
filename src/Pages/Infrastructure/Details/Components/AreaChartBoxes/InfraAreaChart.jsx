// Components
import { Typography } from "@mui/material";
import BaseContainer from "../BaseContainer";
import AreaChart from "../../../../../Components/Charts/AreaChart";
// Utils
import { useTheme } from "@emotion/react";
import { useHardwareUtils } from "../../Hooks/useHardwareUtils";
const InfraAreaChart = ({ config }) => {
	const theme = useTheme();
	const { getDimensions } = useHardwareUtils();
	return (
		<BaseContainer>
			<Typography
				component="h2"
				padding={theme.spacing(8)}
			>
				{config.heading}
			</Typography>
			<AreaChart
				height={getDimensions().areaChartHeight}
				data={config.data}
				dataKeys={config.dataKeys}
				xKey="_id"
				yDomain={config.yDomain}
				customTooltip={config.toolTip}
				xTick={config.xTick}
				yTick={config.yTick}
				strokeColor={config.strokeColor}
				gradient={true}
				gradientStartColor={config.gradientStartColor}
				gradientEndColor="#ffffff"
			/>
		</BaseContainer>
	);
};

export default InfraAreaChart;
