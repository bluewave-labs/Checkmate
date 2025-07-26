import { useTheme } from "@emotion/react";
import { Box, Stack } from "@mui/material";
import PropTypes from "prop-types";

const FallbackContainer = ({ children, type }) => {
	const theme = useTheme();
	return (
		<Box
			border={1}
			borderColor={theme.palette.primary.lowContrast}
			borderRadius={theme.shape.borderRadius}
			backgroundColor={theme.palette.primary.main}
			overflow="hidden"
			sx={{
				display: "flex",
				borderStyle: "dashed",
				height: "fit-content",
				minHeight: "60vh",
				width: {
					sm: "90%",
					md: "70%",
					lg: "50%",
					xl: "40%",
				},
				padding: `${theme.spacing(20)} ${theme.spacing(10)}`,
			}}
		>
			<Stack
				className={`fallback__${type?.trim().split(" ")[0]}`}
				alignItems="center"
				gap={theme.spacing(20)}
			>
				{children}
			</Stack>
		</Box>
	);
};

FallbackContainer.propTypes = {
	children: PropTypes.node,
	type: PropTypes.string,
};

export default FallbackContainer;
