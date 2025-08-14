import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Alert from "../Alert";
import PropTypes from "prop-types";

const renderWarningMessage = (t) => {
	return (
		<>
			{t("pageSpeedWarning")}{" "}
			<Link
				component={RouterLink}
				to="/settings"
				sx={{
					textDecoration: "underline",
					color: "inherit",
					fontWeight: "inherit",
					"&:hover": {
						textDecoration: "underline",
					},
				}}
			>
				{t("pageSpeedLearnMoreLink")}
			</Link>{" "}
			{t("pageSpeedAddApiKey")}
		</>
	);
};

const FallbackPageSpeedWarning = ({ settingsData }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Box sx={{ width: "80%", maxWidth: "600px", zIndex: 1 }}>
			<Box
				sx={{
					"& .alert.row-stack": {
						backgroundColor: theme.palette.warningSecondary.main,
						borderColor: theme.palette.warningSecondary.lowContrast,
						"& .MuiTypography-root": {
							color: theme.palette.warningSecondary.contrastText,
						},
						"& .MuiBox-root > svg": {
							color: theme.palette.warningSecondary.contrastText,
						},
					},
				}}
			>
				{settingsData?.pagespeedKeySet === false && (
					<Alert
						variant="warning"
						hasIcon={true}
						body={renderWarningMessage(t)}
					/>
				)}
			</Box>
		</Box>
	);
};

FallbackPageSpeedWarning.propTypes = {
	settingsData: PropTypes.shape({
		pagespeedKeySet: PropTypes.bool,
	}),
};

export default FallbackPageSpeedWarning;
