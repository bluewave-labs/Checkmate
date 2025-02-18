import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const MonitorHeader = ({ monitor }) => {
	const theme = useTheme();
	return (
		<Stack direction="row">
			<Stack gap={theme.spacing(2)}>
				<Typography variant="h1">{monitor.name}</Typography>
				<Typography variant="h2">
					Distributed Uptime Monitoring powered by DePIN
				</Typography>
			</Stack>
		</Stack>
	);
};

MonitorHeader.propTypes = {
	monitor: PropTypes.object,
};

export default MonitorHeader;
