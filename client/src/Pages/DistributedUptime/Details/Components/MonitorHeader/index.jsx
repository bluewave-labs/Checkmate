import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const MonitorHeader = ({ monitor }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Stack direction="row">
			<Stack gap={theme.spacing(2)}>
				<Typography variant="h1">{monitor.name}</Typography>
				<Typography variant="h2">{t("distributedUptimeDetailsMonitorHeader")}</Typography>
			</Stack>
		</Stack>
	);
};

MonitorHeader.propTypes = {
	monitor: PropTypes.object,
};

export default MonitorHeader;
