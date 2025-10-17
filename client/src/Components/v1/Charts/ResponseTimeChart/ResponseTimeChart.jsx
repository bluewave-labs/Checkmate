import ChartBox from "@/Components/v1/Charts/ChartBox/index.jsx";
import MonitorDetailsAreaChart from "@/Components/v1/Charts/MonitorDetailsAreaChart/index.jsx";
import ResponseTimeIcon from "../../../../assets/icons/response-time-icon.svg?react";
import SkeletonLayout from "./ResponseTimeChartSkeleton.jsx";
import PropTypes from "prop-types";

const ResponseTimeChart = ({
	monitorIsLoading = false,
	groupedChecks = [],
	dateRange,
}) => {
	if (monitorIsLoading) {
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
