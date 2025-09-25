import ChartBox from "../../../../../../Components/Charts/ChartBox/index.jsx";
import MonitorDetailsAreaChart from "../../../../../../Components/Charts/MonitorDetailsAreaChart/index.jsx";
import ResponseTimeIcon from "../../../../../../assets/icons/response-time-icon.svg?react";
import SkeletonLayout from "./ResponseTimeChartSkeleton.jsx";
import PropTypes from "prop-types";

const ResponseTImeChart = ({ isLoading = false, groupedChecks = [], dateRange }) => {
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

ResponseTImeChart.propTypes = {
	isLoading: PropTypes.bool,
	groupedChecks: PropTypes.array,
	dateRange: PropTypes.string,
};

export default ResponseTImeChart;
