import ChartBox from "@/Components/v1/Charts/ChartBox/index.jsx";
import MonitorDetailsAreaChart from "@/Components/v1/Charts/MonitorDetailsAreaChart/index.jsx";
import Icon from "@/Components/v1/Icon";
import SkeletonLayout from "./ResponseTimeChartSkeleton.jsx";
import PropTypes from "prop-types";

const ResponseTImeChart = ({ isLoading = false, groupedChecks = [], dateRange }) => {
	if (isLoading) {
		return <SkeletonLayout />;
	}

	return (
		<ChartBox
			icon={<Icon name="TrendingUp" size={20} />}
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
