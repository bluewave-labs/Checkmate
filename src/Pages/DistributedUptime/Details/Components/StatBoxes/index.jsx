// Components
import { Stack } from "@mui/material";
import StatBox from "../../../../../Components/StatBox";
import LastUpdate from "../LastUpdate";
import UptLogo from "../../../../../assets/icons/upt_logo.png";

// Utils
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const StatBoxes = ({ monitor, lastUpdateTrigger }) => {
	const theme = useTheme();

	return (
		<Stack
			direction="row"
			gap={theme.spacing(8)}
		>
			<StatBox
				heading="Avg Response Time"
				subHeading={`${Math.floor(monitor?.avgResponseTime ?? 0)} ms`}
			/>
			<StatBox
				heading="Checking every"
				subHeading={`${(monitor?.interval ?? 0) / 1000} seconds`}
			/>
			<StatBox
				heading={"Last check"}
				subHeading={
					<LastUpdate
						lastUpdateTime={monitor?.timeSinceLastCheck ?? 0}
						suffix={"seconds ago"}
					/>
				}
			/>
			<StatBox
				heading="Last server push"
				subHeading={
					<LastUpdate
						suffix={"seconds ago"}
						lastUpdateTime={0}
						trigger={lastUpdateTrigger}
					/>
				}
			/>

			<StatBox
				heading="UPT Burned"
				subHeading={monitor?.totalUptBurnt ?? 0}
				img={UptLogo}
				alt="Upt Logo"
			/>
		</Stack>
	);
};

StatBoxes.propTypes = {
	monitor: PropTypes.object,
	lastUpdateTrigger: PropTypes.number,
};

export default StatBoxes;
