import { Box } from "@mui/material";
import ResponseTimeChart from "../../../../Uptime/Details/Components/Charts/ResponseTimeChart";
import { useMonitorResponseTimeData } from "../../Hooks/useMonitorResponseTimeData";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

/**
 * Wrapper component that fetches and displays response time chart for a specific monitor
 */
const ResponseTimeChartWrapper = ({ monitorId, monitorName, dateRange = "recent" }) => {
	const theme = useTheme();
	const { groupedChecks, isLoading, error } = useMonitorResponseTimeData({
		monitorId,
		dateRange,
		enabled: true,
	});

	if (error) {
		console.error(`Error loading response time data for ${monitorName}:`, error);
		return null;
	}

	return (
		<Box mt={theme.spacing(4)}>
			<ResponseTimeChart
				groupedChecks={groupedChecks}
				dateRange={dateRange}
				isLoading={isLoading}
			/>
		</Box>
	);
};

ResponseTimeChartWrapper.propTypes = {
	monitorId: PropTypes.string.isRequired,
	monitorName: PropTypes.string.isRequired,
	dateRange: PropTypes.string,
};

export default ResponseTimeChartWrapper;