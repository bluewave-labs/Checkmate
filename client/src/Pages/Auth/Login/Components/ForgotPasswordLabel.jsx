import { Box, Typography, useTheme } from "@mui/material";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { Trans, useTranslation } from "react-i18next";

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
				<Trans
					i18nKey="auth.login.links.forgotPassword"
					components={{
						a: (
							<Typography
								component="span"
								color={theme.palette.accent.main}
								ml={theme.spacing(2)}
								sx={{ userSelect: "none" }}
								onClick={handleNavigate}
							/>
						),
					}}
				/>
			</Typography>
		</Box>
	);
};

ForgotPasswordLabel.propTypes = {
	email: PropTypes.string.isRequired,
	errorEmail: PropTypes.string.isRequired,
};

export default ForgotPasswordLabel;
