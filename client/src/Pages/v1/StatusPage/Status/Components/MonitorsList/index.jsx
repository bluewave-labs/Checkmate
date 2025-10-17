// Components
import { Stack, Box } from "@mui/material";
import Host from "@/Components/v1/Host/index.jsx";
import StatusPageBarChart from "@/Components/v1/Charts/StatusPageBarChart/index.jsx";
import { StatusLabel } from "@/Components/v1/Label/index.jsx";

//Utils
import { useTheme } from "@mui/material/styles";
import { useMonitorUtils } from "../../../../../../Hooks/v1/useMonitorUtils.js";
import PropTypes from "prop-types";

import { useSelector } from "react-redux";
import ResponseTimeChart from "@/Components/v1/Charts/ResponseTimeChart/ResponseTimeChart.jsx";
import { useFetchUptimeMonitorById } from "@/Hooks/v1/monitorHooks.js";

const MonitorsList = ({
	isLoading = false,
	shouldRender = true,
	monitors = [],
	statusPage = {},
}) => {
	const theme = useTheme();
	const { determineState } = useMonitorUtils();

	const { showURL } = useSelector((state) => state.ui);

	return (
		<>
			{monitors?.map((monitor) => (
				<MonitorListItem
					key={monitor._id}
					monitor={monitor}
					statusPage={statusPage}
					showURL={showURL}
					dateRange="recent"
				/>
			))}
		</>
	);
};

function MonitorListItem({ monitor, statusPage, showURL, dateRange }) {
	const theme = useTheme();
	const { determineState } = useMonitorUtils();
	const status = determineState(monitor);
	const [monitorData, , monitorIsLoading] = useFetchUptimeMonitorById({
		monitorId: monitor._id,
		dateRange,
		trigger: false,
	});

	return (
		<Stack
			width="100%"
			gap={theme.spacing(2)}
		>
			<Host
				url={monitor.url}
				title={monitor.name}
				percentageColor={monitor.percentageColor}
				percentage={monitor.percentage}
				showURL={showURL}
			/>
			<Stack
				direction="row"
				alignItems="center"
				gap={theme.spacing(20)}
			>
				{statusPage.showCharts !== false && (
					<Box flex={9}>
						<StatusPageBarChart checks={monitor?.checks?.slice().reverse()} />
					</Box>
				)}
				<Box flex={statusPage.showCharts !== false ? 1 : 10}>
					<StatusLabel
						status={status}
						text={status}
						customStyles={{ textTransform: "capitalize" }}
					/>
				</Box>
			</Stack>
			{statusPage.showResponseTimeChart !== false && (
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(20)}
					mt={2}
				>
					<ResponseTimeChart
						monitorIsLoading={monitorIsLoading}
						groupedChecks={monitorData?.groupedChecks}
						dateRange={dateRange}
					/>
				</Stack>
			)}
		</Stack>
	);
}

MonitorListItem.propTypes = {
	monitor: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		url: PropTypes.string,
		name: PropTypes.string,
		percentageColor: PropTypes.string,
		percentage: PropTypes.number,
		checks: PropTypes.array,
	}).isRequired,
	statusPage: PropTypes.object,
	showURL: PropTypes.bool,
	dateRange: PropTypes.string.isRequired,
};

MonitorsList.propTypes = {
	monitors: PropTypes.array.isRequired,
	statusPage: PropTypes.object,
};

export default MonitorsList;
