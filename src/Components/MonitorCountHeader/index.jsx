import { Stack } from "@mui/material";
import { Heading } from "../Heading";
import CircularCount from "../CircularCount";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import SkeletonLayout from "./skeleton";

const MonitorCountHeader = ({
	shouldRender = true,
	monitorCount,
	heading,
	sx,
	children,
}) => {
	const theme = useTheme();
	if (!shouldRender) return <SkeletonLayout />;

	return (
		<Stack
			direction="row"
			alignItems="center"
			gap={theme.spacing(2)}
			sx={{ ...sx }}
		>
			<Heading component="h2">{heading}</Heading>
			<CircularCount count={monitorCount} />
			{children}
		</Stack>
	);
};

MonitorCountHeader.propTypes = {
	shouldRender: PropTypes.bool,
	monitorCount: PropTypes.number,
	heading: PropTypes.string,
	children: PropTypes.node,
	sx: PropTypes.object,
};

export default MonitorCountHeader;
