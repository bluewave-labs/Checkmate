// Components
import { Stack } from "@mui/material";

// Utils
import { useTheme } from "@emotion/react";

const Container = ({ children, direction, backgroundColor, sx }) => {
	const theme = useTheme();
	let bgColor =
		typeof backgroundColor !== "undefined"
			? backgroundColor
			: theme.palette.background.main;
	return (
		<Stack
			direction={direction}
			padding={theme.spacing(8)}
			gap={theme.spacing(2)}
			border={1}
			borderColor={theme.palette.primary.lowContrast}
			borderStyle="solid"
			borderRadius={theme.spacing(4)}
			backgroundColor={bgColor}
			sx={{ ...sx }}
		>
			{children}
		</Stack>
	);
};

export const ColContainer = ({ children, backgroundColor, sx }) => {
	return (
		<Container
			direction="column"
			backgroundColor={backgroundColor}
			sx={{ ...sx }}
		>
			{children}
		</Container>
	);
};

export const RowContainer = ({ children, backgroundColor, sx }) => {
	return (
		<Container
			direction="row"
			backgroundColor={backgroundColor}
			sx={{ ...sx }}
		>
			{children}
		</Container>
	);
};
