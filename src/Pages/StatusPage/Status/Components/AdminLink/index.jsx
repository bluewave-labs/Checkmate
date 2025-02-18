// Components
import { Box, Typography } from "@mui/material";

// Utils
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const AdminLink = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Box>
			<Typography
				className="forgot-p"
				display="inline-block"
				color={theme.palette.primary.contrastText}
			>
				Administrator?
			</Typography>
			<Typography
				component="span"
				color={theme.palette.accent.main}
				ml={theme.spacing(2)}
				sx={{ cursor: "pointer" }}
				onClick={() => navigate("/login")}
			>
				Login here
			</Typography>
		</Box>
	);
};

export default AdminLink;
