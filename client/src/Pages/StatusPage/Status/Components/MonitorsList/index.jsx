// Components
import { Stack, Box } from "@mui/material";
import Host from "../../../../../Components/Host";
import StatusPageBarChart from "../../../../../Components/Charts/StatusPageBarChart";
import ResponseTimeChartWrapper from "./ResponseTimeChartWrapper";
import { StatusLabel } from "../../../../../Components/Label";

//Utils
import { useTheme } from "@mui/material/styles";
import { useMonitorUtils } from "../../../../../Hooks/useMonitorUtils";
import PropTypes from "prop-types";
import { DATE_RANGES } from "../../../../../Utils/statusPageConstants";

import { useSelector } from "react-redux";

const MonitorsList = ({
	monitors = [],
	statusPage = {},
	dateRange = DATE_RANGES.RECENT,
}) => {
	const theme = useTheme();
	const { determineState } = useMonitorUtils();

	const { showURL } = useSelector((state) => state.ui);

	return (
		<>
			{monitors?.map((monitor) => {
				const status = determineState(monitor);
				return (
					<Stack
						key={monitor._id}
						width="100%"
						gap={theme.spacing(2)}
					>
						<Host
							key={monitor._id}
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
						{statusPage.showResponseTimeChart === true && (
							<ResponseTimeChartWrapper
								monitorId={monitor._id}
								monitorName={monitor.name}
								dateRange={dateRange}
							/>
						)}
					</Stack>
				);
			})}
		</>
	);
};

MonitorsList.propTypes = {
	monitors: PropTypes.array.isRequired,
	statusPage: PropTypes.object,
	dateRange: PropTypes.string,
};

export default MonitorsList;
