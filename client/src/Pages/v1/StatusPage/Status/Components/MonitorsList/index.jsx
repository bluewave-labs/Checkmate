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
			{monitors?.map((monitor) => {
				const status = determineState(monitor);
				return (
					<Stack
						key={monitor._id}
						width="100%"
						gap={theme.spacing(10)}
						margin="0 auto"
						maxWidth="95%"
					>
						<Host
							key={monitor._id}
							url={monitor.url}
							title={monitor.name}
							percentageColor={monitor.percentageColor}
							percentage={monitor.percentage}
							showURL={showURL}
							status={status}
						/>
						<Stack
							direction="row"
							alignItems="center"
							gap={theme.spacing(1)}
						>
							{statusPage.showCharts !== false && (
								<Box flex={9}>
									<StatusPageBarChart checks={monitor?.checks?.slice().reverse()} />
								</Box>
							)}
						</Stack>
					</Stack>
				);
			})}
		</>
	);
};

MonitorsList.propTypes = {
	monitors: PropTypes.array.isRequired,
	statusPage: PropTypes.object,
};

export default MonitorsList;
