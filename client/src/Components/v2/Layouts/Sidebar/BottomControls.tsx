import { useTheme } from "@mui/material/styles";

import Stack from "@mui/material/Stack";

export const BottomControls = ({}) => {
	const theme = useTheme();
	return (
		<Stack
			direction="row"
			height={50}
			py={theme.spacing(4)}
			px={theme.spacing(8)}
			gap={theme.spacing(2)}
		></Stack>
	);
};
