// Components
import { Box, Typography } from "@mui/material";

// Utils
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AdminLink = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<Box>
			<Typography
				className="forgot-p"
				display="inline-block"
				color={theme.palette.primary.contrastText}
			>
				{t("administrator")}
			</Typography>
			<Typography
				component="span"
				color={theme.palette.accent.main}
				ml={theme.spacing(2)}
				sx={{ cursor: "pointer" }}
				onClick={() => navigate("/login")}
			>
				{t("loginHere")}
			</Typography>
		</Box>
	);
};

export default AdminLink;
