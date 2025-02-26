// Components
import { Stack } from "@mui/material";
import InfoBox from "../../../../../Components/InfoBox";
import LastUpdate from "../LastUpdate";

// Utils
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const StatBoxes = ({ monitor, lastUpdateTrigger }) => {
	const theme = useTheme();

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			flexWrap="wrap"
			gap={theme.spacing(8)}
		>
			<InfoBox
				sx={{ flex: 1 }}
				heading="Avg Response Time"
				subHeading={`${Math.floor(monitor?.avgResponseTime ?? 0)} ms`}
			/>
			<InfoBox
				sx={{ flex: 1 }}
				heading="Checking every"
				subHeading={`${(monitor?.interval ?? 0) / 1000} seconds`}
			/>
			<InfoBox
				sx={{ flex: 1 }}
				heading={"Last check"}
				subHeading={
					<LastUpdate
						lastUpdateTime={monitor?.timeSinceLastCheck ?? 0}
						suffix={"seconds ago"}
					/>
				}
			/>
			<InfoBox
				sx={{ flex: 1 }}
				heading="Last server push"
				subHeading={
					<LastUpdate
						suffix={"seconds ago"}
						lastUpdateTime={0}
						trigger={lastUpdateTrigger}
					/>
				}
			/>
		</Stack>
	);
};

StatBoxes.propTypes = {
	monitor: PropTypes.object,
	lastUpdateTrigger: PropTypes.number,
};

export default StatBoxes;
