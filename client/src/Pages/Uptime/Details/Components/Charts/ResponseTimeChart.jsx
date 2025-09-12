import ChartBox from "../../../../../Components/Charts/ChartBox";
import MonitorDetailsAreaChart from "../../../../../Components/Charts/MonitorDetailsAreaChart";
import ResponseTimeIcon from "../../../../../assets/icons/response-time-icon.svg?react";
import SkeletonLayout from "./ResponseTimeChartSkeleton";
import PropTypes from "prop-types";

const ResponseTimeChart = ({ isLoading = false, groupedChecks = [], dateRange }) => {
	if (isLoading) {
		return <SkeletonLayout />;
	}

	return (
		<ChartBox
			icon={<ResponseTimeIcon />}
			header="Response Times"
		>
			<MonitorDetailsAreaChart
				checks={groupedChecks}
				dateRange={dateRange}
			/>
		</ChartBox>
	);
};

ResponseTimeChart.propTypes = {
	isLoading: PropTypes.bool,
	groupedChecks: PropTypes.array,
	dateRange: PropTypes.string,
};

export default ResponseTimeChart;
