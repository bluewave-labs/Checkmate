import { Typography } from "@mui/material";
import { useTheme } from "@emotion/react";

const NetworkError = () => {
	const theme = useTheme();
	return (
		<>
			<Typography
				variant="h1"
				marginY={theme.spacing(4)}
				color={theme.palette.primary.contrastTextTertiary}
			>
				Network error
			</Typography>
			<Typography>Please check your connection</Typography>
		</>
	);
};

export default NetworkError;
