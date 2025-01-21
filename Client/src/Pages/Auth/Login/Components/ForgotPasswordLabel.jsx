import { Box, Typography, useTheme } from "@mui/material";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const ForgotPasswordLabel = ({ email, errorEmail }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const handleNavigate = () => {
		if (email !== "" && !errorEmail) {
			sessionStorage.setItem("email", email);
		}
		navigate("/forgot-password");
	};

	return (
		<Box textAlign="center">
			<Typography
				className="forgot-p"
				display="inline-block"
				color={theme.palette.primary.main}
			>
				{t("authForgotPasswordTitle")}
			</Typography>
			<Typography
				component="span"
				color={theme.palette.primary.main}
				ml={theme.spacing(2)}
				sx={{ userSelect: "none" }}
				onClick={handleNavigate}
			>
				{t("authForgotPasswordResetPassword")}
			</Typography>
		</Box>
	);
};

ForgotPasswordLabel.propTypes = {
	email: PropTypes.string.isRequired,
	errorEmail: PropTypes.string.isRequired,
};

export default ForgotPasswordLabel;
