// Components
import { Stack, Box } from "@mui/material";
import Host from "../../../../../Components/Host";
import StatusPageBarChart from "../../../../../Components/Charts/StatusPageBarChart";
import { StatusLabel } from "../../../../../Components/Label";

//Utils
import { useTheme } from "@mui/material/styles";
import useUtils from "../../../../Uptime/Monitors/Hooks/useUtils";
import PropTypes from "prop-types";

import { useSelector } from "react-redux";

const MonitorsList = ({ isLoading = false, shouldRender = true, monitors = [] }) => {
	const theme = useTheme();
	const { determineState } = useUtils();

	const { statusURL } = useSelector((state) => state.ui);
	const showURL = statusURL === "enabled";

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
							<Box flex={9}>
								<StatusPageBarChart checks={monitor?.checks?.slice().reverse()} />
							</Box>
							<Box flex={1}>
								<StatusLabel
									status={status}
									text={status}
									customStyles={{ textTransform: "capitalize" }}
								/>
							</Box>
						</Stack>
					</Stack>
				);
			})}
		</>
	);
};

MonitorsList.propTypes = {
	monitors: PropTypes.array.isRequired,
};

export default MonitorsList;
