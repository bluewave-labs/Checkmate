import ChartBox from "../../../../../Components/Charts/ChartBox";
import AreaChart from "../Charts/AreaChart";
import AreaChartLegend from "../Charts/AreaChartLegend";
import SkeletonLayout from "./skeleton";
import ScoreIcon from "../../../../../assets/icons/monitor-graph-line.svg?react";
import { Stack } from "@mui/material";
import PropTypes from "prop-types";

import { useTheme } from "@emotion/react";

const PageSpeedAreaChart = ({ shouldRender, monitor, metrics, handleMetrics }) => {
	const theme = useTheme();

	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	const data = monitor?.checks ? [...monitor.checks].reverse() : [];

	return (
		<Stack
			direction="row"
			gap={theme.spacing(10)}
		>
			<ChartBox
				justifyContent="flex-start"
				icon={<ScoreIcon />}
				header="Score history"
				height="100%"
				borderRadiusRight={16}
				Legend={
					<AreaChartLegend
						metrics={metrics}
						handleMetrics={handleMetrics}
					/>
				}
			>
				<AreaChart
					data={data}
					monitor={monitor}
					metrics={metrics}
				/>
			</ChartBox>
		</Stack>
	);
};

PageSpeedAreaChart.propTypes = {
	shouldRender: PropTypes.bool,
	monitor: PropTypes.object,
	metrics: PropTypes.object,
	handleMetrics: PropTypes.func,
};

export default PageSpeedAreaChart;
