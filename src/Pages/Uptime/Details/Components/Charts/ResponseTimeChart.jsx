import ChartBox from "../../../../../Components/Charts/ChartBox";
import MonitorDetailsAreaChart from "../../../../../Components/Charts/MonitorDetailsAreaChart";
import ResponseTimeIcon from "../../../../../assets/icons/response-time-icon.svg?react";
import SkeletonLayout from "./ResponseTimeChartSkeleton";
import PropTypes from "prop-types";

const ResponseTImeChart = ({ shouldRender = true, monitor, dateRange }) => {
	if (!shouldRender) {
		return <SkeletonLayout />;
	}

	return (
		<ChartBox
			icon={<ResponseTimeIcon />}
			header="Response Times"
		>
			<MonitorDetailsAreaChart
				checks={monitor?.groupedChecks ?? []}
				dateRange={dateRange}
			/>
		</ChartBox>
	);
};

ResponseTImeChart.propTypes = {
	shouldRender: PropTypes.bool,
	monitor: PropTypes.object,
	dateRange: PropTypes.string,
};

export default ResponseTImeChart;
