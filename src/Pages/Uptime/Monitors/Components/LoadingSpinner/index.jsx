import { CircularProgress, Box } from "@mui/material";
import { useTheme } from "@emotion/react";
import PropTypes from "prop-types";
const LoadingSpinner = ({ shouldRender }) => {
	const theme = useTheme();
	if (shouldRender === false) {
		return;
	}

	return (
		<>
			<Box
				width="100%"
				height="100%"
				position="absolute"
				sx={{
					backgroundColor: theme.palette.primary.main,
					opacity: 0.8,
					zIndex: 100,
				}}
			/>
			<Box
				height="100%"
				position="absolute"
				top="50%"
				left="50%"
				sx={{
					transform: "translateX(-50%)",
					zIndex: 101,
				}}
			>
				<CircularProgress
					sx={{
						color: theme.palette.accent.main,
					}}
				/>
			</Box>
		</>
	);
};

LoadingSpinner.propTypes = {
	shouldRender: PropTypes.bool,
};

export default LoadingSpinner;
