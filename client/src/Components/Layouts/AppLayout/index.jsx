import Box from "@mui/material/Box";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import BackgroundSVG from "../../../assets/Images/background.svg";

const AppLayout = ({ children }) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				minHeight: "100vh",
				backgroundColor: theme.palette.primaryBackground.main,
				backgroundImage: `url("${BackgroundSVG}")`,
				backgroundSize: "100% 100%",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				color: theme.palette.primary.contrastText,
			}}
		>
			{children}
		</Box>
	);
};

AppLayout.propTypes = {
	children: PropTypes.node,
};

export default AppLayout;
