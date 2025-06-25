import { Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";

const MonitorCountHeader = ({
	isLoading = false,
	monitorCount,
	heading = "monitors",
	sx,
	children,
}) => {
	const theme = useTheme();
	if (isLoading) return <SkeletonLayout />;

	if (monitorCount === 1) {
		heading = "monitor";
	}

	return (
		<Stack
			direction="row"
			alignItems="center"
			display="flex"
			width="fit-content"
			height={theme.spacing(18)}
			gap={theme.spacing(2)}
			mt={theme.spacing(2)}
			px={theme.spacing(4)}
			pt={theme.spacing(2)}
			pb={theme.spacing(3)}
			borderRadius={theme.spacing(1)}
			sx={{
				...sx,
				backgroundColor: theme.palette.secondary.main,
			}}
		>
			{monitorCount} <Typography component="h2">{heading}</Typography>
			{children}
		</Stack>
	);
};

MonitorCountHeader.propTypes = {
	isLoading: PropTypes.bool,
	monitorCount: PropTypes.number,
	heading: PropTypes.string,
	children: PropTypes.node,
	sx: PropTypes.object,
};

export default MonitorCountHeader;
